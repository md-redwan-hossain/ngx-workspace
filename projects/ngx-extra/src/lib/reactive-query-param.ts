import {
  Injectable,
  Injector,
  Signal,
  assertInInjectionContext,
  effect,
  inject,
  isDevMode,
  isSignal,
  runInInjectionContext,
  untracked
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import LzString from "lz-string";
import { Observable, map } from "rxjs";
import { cleanNullishFromObject } from "./helpers";
import { createSignalChangeNotifier } from "./create-signal-change-notifier";

type NavigateMethodFields = Pick<
  NavigationExtras,
  | "queryParamsHandling"
  | "onSameUrlNavigation"
  | "replaceUrl"
  | "skipLocationChange"
  | "preserveFragment"
>;

export type ReactiveQueryParamOptions<T> = {
  queryParamKey: string;
  source: Signal<T> | Observable<T>;
  handleInitialSnapshot?: (payload: T) => void;
  handleStream?: (payload: T) => void;
  injector?: Injector;
  routerOptions?: NavigateMethodFields;
  base64EncodingOptions?: {
    disableEncoding?: boolean;
    disableJsonStringifyWhenNoEncoding?: boolean;
  };
  queryParamOptions?: {
    blackListedValues?: any[];
    preserveStaleOnBlacklistedValue?: boolean;
  };
};

@Injectable({ providedIn: "root" })
class ReactiveQueryParamGlobalHandler {
  private router = inject(Router);

  private schedulerNotifier = createSignalChangeNotifier();
  private currentKeys: Record<string, string | null> = {};
  private navigationExtras: NavigateMethodFields = {};

  constructor() {
    effect(() => {
      if (!this.schedulerNotifier.listen()) {
        return;
      }
      untracked(() => {
        this.router
          .navigate([], {
            queryParams: this.currentKeys,
            ...this.navigationExtras
          })
          .then(() => {
            this.currentKeys = {};
            this.navigationExtras = {};
          });
      });
    });
  }

  scheduleNavigation(key: string, value: string | null, navOptions: NavigateMethodFields) {
    this.currentKeys[key] = value;
    this.navigationExtras = { ...cleanNullishFromObject(navOptions) };
    this.schedulerNotifier.notify();
  }
}

export function reactiveQueryParam<T>(options: ReactiveQueryParamOptions<T>) {
  if (isDevMode() && !options?.injector) {
    assertInInjectionContext(reactiveQueryParam);
  }

  const assertedInjector = options.injector ?? inject(Injector);

  const blackList = options.queryParamOptions?.blackListedValues ?? [null, undefined, ""];

  const useEncoding = !options?.base64EncodingOptions?.disableEncoding;

  const useStringifyOnNoEncoding =
    !options?.base64EncodingOptions?.disableJsonStringifyWhenNoEncoding;

  const deserialize = (payload: string): T => {
    if (useEncoding) {
      const decoded = LzString.decompressFromEncodedURIComponent(payload);
      return JSON.parse(decoded);
    }

    if (!useEncoding && useStringifyOnNoEncoding) {
      return JSON.parse(payload);
    } else {
      try {
        return JSON.parse(payload);
      } catch {
        return payload as T;
      }
    }
  };

  const serialize = (value: T | null | undefined): string | null => {
    if (blackList.some((elem) => elem === value)) {
      return null;
    }
    if (useEncoding) {
      return LzString.compressToEncodedURIComponent(JSON.stringify(value));
    }

    if (!useEncoding && useStringifyOnNoEncoding) {
      return JSON.stringify(value);
    } else {
      if (typeof value === "string") {
        return value;
      } else {
        return JSON.stringify(value);
      }
    }
  };

  runInInjectionContext(assertedInjector, () => {
    const globalHandler = inject(ReactiveQueryParamGlobalHandler);
    const route = inject(ActivatedRoute);

    // Handle initial snapshot
    const payloadFromSnapshot = route.snapshot.queryParamMap.get(options.queryParamKey);

    if (payloadFromSnapshot !== null && options.handleInitialSnapshot) {
      const deserialized = deserialize(payloadFromSnapshot);
      options.handleInitialSnapshot(deserialized);
    }

    // Handle query param stream
    route.queryParamMap
      .pipe(
        map((params) => params.get(options.queryParamKey)),
        takeUntilDestroyed()
      )
      .subscribe((payloadFromStream) => {
        if (payloadFromStream !== null && options.handleStream) {
          const deserialized = deserialize(payloadFromStream);
          options.handleStream(deserialized);
        }
      });

    // Handle source changes
    let source$: Observable<T>;

    if (isSignal(options.source)) {
      source$ = toObservable(options.source);
    } else if (options.source instanceof Observable) {
      source$ = options.source;
    } else {
      throw new Error("Invalid source");
    }

    source$.pipe(takeUntilDestroyed()).subscribe((value) => {
      const serializedValue = serialize(value);

      if (serializedValue === null && options?.queryParamOptions?.preserveStaleOnBlacklistedValue) {
        return;
      }

      globalHandler.scheduleNavigation(options.queryParamKey, serializedValue, {
        ...cleanNullishFromObject(options?.routerOptions),
        queryParamsHandling: options.routerOptions?.queryParamsHandling ?? "merge"
      });
    });
  });
}
