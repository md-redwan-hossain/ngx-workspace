import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Injector,
  isDevMode,
  runInInjectionContext,
  signal,
  type WritableSignal
} from "@angular/core";

export type ReactiveLocalStorageItemOptions<T> = {
  defaultValue?: T;
  parse?: (raw: unknown) => T;
  syncAcrossTabs?: boolean;
  injector?: Injector;
};

export function reactiveLocalStorageItem<T>(
  key: string,
  opts?: ReactiveLocalStorageItemOptions<T>
): WritableSignal<T | null> {
  if (isDevMode() && !opts?.injector) {
    assertInInjectionContext(reactiveLocalStorageItem);
  }

  const assertedInjector = opts?.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const readFromStorage = (): T | null => {
      const raw = localStorage.getItem(key);
      if (raw === null) return opts?.defaultValue ?? null;

      const parsed = JSON.parse(raw);
      return opts?.parse ? opts.parse(parsed) : (parsed as T);
    };

    const sig = signal<T | null>(readFromStorage());

    effect(() => {
      const value = sig();
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });

    if (opts?.syncAcrossTabs !== false) {
      const destroyRef = inject(DestroyRef);

      const onStorageChange = (event: StorageEvent) => {
        if (event.key !== key) return;

        if (event.newValue !== null) {
          const parsed = JSON.parse(event.newValue);
          sig.set(opts?.parse ? opts.parse(parsed) : (parsed as T));
        } else {
          sig.set(opts?.defaultValue ?? null);
        }
      };

      window.addEventListener("storage", onStorageChange);
      destroyRef.onDestroy(() => window.removeEventListener("storage", onStorageChange));
    }

    return sig;
  });
}
