import {
  CreateEffectOptions,
  effect,
  EffectCleanupRegisterFn,
  Signal,
  untracked
} from "@angular/core";

interface SlimEffectOptions extends CreateEffectOptions {
  lazy?: boolean;
}

export function slimEffect<T>(
  dependency: Signal<T>,
  fn: (dependency: T, onCleanup: EffectCleanupRegisterFn) => void,
  options?: SlimEffectOptions
) {
  if (options?.lazy) {
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
  } else {
    return effect((onCleanup) => {
      const dep = dependency();
      untracked(() => {
        fn(dep, onCleanup);
      });
    }, options);
  }
}
