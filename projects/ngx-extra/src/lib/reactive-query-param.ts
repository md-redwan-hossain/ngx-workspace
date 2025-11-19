import {
  DestroyRef,
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
import { Observable, filter, map } from "rxjs";
import { createSignalChangeNotifier } from "./create-signal-change-notifier";
import { cleanNullishFromObject } from "./helpers";

export type SlimNavigationExtras = Pick<
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
  parse?: (rawData: any) => T | null;
  handleInitialSnapshot?: (payload: T) => void;
  handleStream?: (payload: T) => void;
  injector?: Injector;
  routerOptions?: SlimNavigationExtras;
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
  private navigationExtras: SlimNavigationExtras = {};

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

  scheduleNavigation(key: string, value: string | null, navOptions: SlimNavigationExtras) {
    this.currentKeys[key] = value;
    this.setCurrentNavigationExtras(navOptions);
    this.schedulerNotifier.notify();
  }

  private setCurrentNavigationExtras(config: Partial<SlimNavigationExtras> = {}) {
    const {
      queryParamsHandling,
      onSameUrlNavigation,
      replaceUrl,
      skipLocationChange,
      preserveFragment
    } = config;

    if (queryParamsHandling || queryParamsHandling === "") {
      this.navigationExtras.queryParamsHandling = queryParamsHandling;
    }
    if (onSameUrlNavigation) {
      this.navigationExtras.onSameUrlNavigation = onSameUrlNavigation;
    }
    if (replaceUrl) {
      this.navigationExtras.replaceUrl = replaceUrl;
    }
    if (skipLocationChange) {
      this.navigationExtras.skipLocationChange = skipLocationChange;
    }
    if (preserveFragment) {
      this.navigationExtras.preserveFragment = preserveFragment;
    }
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
    const destroyRef = inject(DestroyRef);

    // Handle initial snapshot
    const payloadFromSnapshot = route.snapshot.queryParamMap.get(options.queryParamKey);

    if (
      payloadFromSnapshot !== null &&
      payloadFromSnapshot !== "" &&
      options.handleInitialSnapshot
    ) {
      const deserialized = deserialize(payloadFromSnapshot);
      if (!options.parse) {
        options.handleInitialSnapshot(deserialized);
      } else {
        try {
          const parsedValue = options.parse(deserialized);
          if (parsedValue !== null) {
            options.handleInitialSnapshot(parsedValue);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    // Handle query param stream
    route.queryParamMap
      .pipe(
        map((params) => params.get(options.queryParamKey)),
        filter((value) => value !== null),
        filter((value) => value !== ""),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((payloadFromStream) => {
        if (!options.handleStream) {
          return;
        }
        const deserialized = deserialize(payloadFromStream);
        if (!options.parse) {
          options.handleStream(deserialized);
        } else {
          try {
            const parsedValue = options.parse(deserialized);
            if (parsedValue !== null) {
              options.handleStream(parsedValue);
            }
          } catch (error) {
            console.error(error);
          }
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

    source$.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
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
