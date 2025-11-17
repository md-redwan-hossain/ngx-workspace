import {
  Injector,
  isDevMode,
  assertInInjectionContext,
  inject,
  runInInjectionContext
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";

export type RxSubscriberOptions<T> = {
  handleStream: (payload: T) => void;
  injector?: Injector;
};

export function rxSubscriber<T>(source: Observable<T>, options: RxSubscriberOptions<T>) {
  if (isDevMode() && !options.injector) {
    assertInInjectionContext(rxSubscriber);
  }
  const assertedInjector = options.injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    source.pipe(takeUntilDestroyed()).subscribe((payloadFromStream) => {
      options.handleStream(payloadFromStream);
    });
  });
}
