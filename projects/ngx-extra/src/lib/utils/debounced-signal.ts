import {
  Signal,
  Injector,
  isDevMode,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
  isSignal
} from "@angular/core";
import { toSignal, toObservable, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime } from "rxjs";

export function debouncedSignal<T>(source: Signal<T>, ms: number, injector?: Injector) {
  if (isDevMode() && !injector) {
    assertInInjectionContext(debouncedSignal);
  }
  const assertedInjector = injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    if (isSignal(source)) {
      return toSignal(toObservable(source).pipe(debounceTime(ms), takeUntilDestroyed()));
    } else {
      throw new Error("Invalid source");
    }
  });
}
