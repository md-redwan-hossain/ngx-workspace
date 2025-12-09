import {
  assertInInjectionContext,
  inject,
  Injector,
  isDevMode,
  linkedSignal,
  runInInjectionContext,
  Signal,
  ValueEqualityFn
} from "@angular/core";

type Value<T> = { current: T; previous: T | null };

type PairwiseSignalOptions<T> = {
  equalityFn?: ValueEqualityFn<Value<T>>;
  injector?: Injector;
};

export function pairwiseSignal<T>(source: Signal<T>, options?: PairwiseSignalOptions<T>) {
  if (isDevMode() && !options?.injector) {
    assertInInjectionContext(pairwiseSignal);
  }
  const assertedInjector = options?.injector ?? inject(Injector);

  const defaultEqualityFn = (a: Value<T>, b: Value<T>) =>
    JSON.stringify(a.previous) === JSON.stringify(b.current);

  return runInInjectionContext(assertedInjector, () => {
    const pair = linkedSignal<T, Value<T>>({
      source: source,
      equal: options?.equalityFn ?? defaultEqualityFn,
      computation: (current, previous) => {
        console.log(JSON.stringify(previous) === JSON.stringify(current));
        return {
          current,
          previous: previous?.value.current ?? null
        };
      }
    });

    return pair.asReadonly();
  });
}
