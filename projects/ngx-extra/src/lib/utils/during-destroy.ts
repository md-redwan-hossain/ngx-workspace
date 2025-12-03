import {
  Injector,
  isDevMode,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
  DestroyRef
} from "@angular/core";

export function duringDestroy(fn: () => void, injector?: Injector) {
  if (isDevMode() && !injector) {
    assertInInjectionContext(duringDestroy);
  }
  const assertedInjector = injector ?? inject(Injector);

  runInInjectionContext(assertedInjector, () => {
    inject(DestroyRef).onDestroy(fn);
  });
}
