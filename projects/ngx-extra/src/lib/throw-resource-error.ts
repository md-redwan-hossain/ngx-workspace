import { HttpResourceRef } from "@angular/common/http";
import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
  effect,
  isDevMode
} from "@angular/core";

export function throwResourceError<T = any>(resorce: HttpResourceRef<T>, injector?: Injector) {
  if (isDevMode() && !injector) {
    assertInInjectionContext(throwResourceError);
  }
  const assertedInjector = injector ?? inject(Injector);
  runInInjectionContext(assertedInjector, () => {
    effect(() => {
      if (resorce.status() === "error") {
        throw resorce.error();
      }
    });
  });
}
