import {
  assertInInjectionContext,
  inject,
  Injector,
  isDevMode,
  runInInjectionContext
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";

export type RxSubscriberOptions = {
  injector?: Injector;
};

export function rxSubscriber<T>(
  source: Observable<T>,
  next: (payload: T) => void,
  options?: RxSubscriberOptions
) {
  if (isDevMode() && !options?.injector) {
    assertInInjectionContext(rxSubscriber);
  }
  const assertedInjector = options?.injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    source.pipe(takeUntilDestroyed()).subscribe((payloadFromStream) => {
      next(payloadFromStream);
    });
  });
}
