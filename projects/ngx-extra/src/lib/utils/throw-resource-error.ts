import { HttpResourceRef } from "@angular/common/http";
import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
  effect,
  isDevMode,
  untracked
} from "@angular/core";

/**
 * Subscribe to a resource and re-throw its error inside an Angular effect.
 *
 * Important: Before accessing the `value()` of a resource, always do conditional check by `hasValue()`.
 * Otherwise `throwResourceError` can lead to infinite loop.
 *
 * @param resorce The `HttpResourceRef<T>` to observe for errors.
 * @param injector Optional `Injector` to run the effect in (defaults to current injection context).
 */
export function throwResourceError<T = any>(resorce: HttpResourceRef<T>, injector?: Injector) {
  if (isDevMode() && !injector) {
    assertInInjectionContext(throwResourceError);
  }
  const assertedInjector = injector ?? inject(Injector);
  runInInjectionContext(assertedInjector, () => {
    effect(() => {
      if (resorce.status() === "error") {
        untracked(() => {
          throw resorce.error();
        });
      }
    });
  });
}
