import { effect, EffectCleanupRegisterFn, Injector, Signal, untracked } from "@angular/core";

type SlimLazyEffectOptions = {
  injector?: Injector;
};

export function slimLazyEffect<T>(
  dependency: Signal<T>,
  fn: (dependency: T, onCleanup: EffectCleanupRegisterFn) => void,
  options?: SlimLazyEffectOptions
) {
  let warm = false;
  return effect((onCleanup) => {
    const dep = dependency();
    untracked(() => {
      if (warm) {
        fn(dep, onCleanup);
      }
      warm = true;
    });
  }, options);
}
