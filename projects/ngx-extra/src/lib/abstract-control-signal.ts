import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  isDevMode,
  runInInjectionContext,
  signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  FormControlStatus,
  PristineChangeEvent,
  StatusChangeEvent,
  TouchedChangeEvent,
  ValidationErrors,
  ValueChangeEvent
} from "@angular/forms";

type AbstractControlSignalOptions = {
  injector?: Injector;
};

export function abstractControlSignal<T>(
  source: AbstractControl<T>,
  options: AbstractControlSignalOptions = {}
) {
  if (isDevMode() && !options.injector) {
    assertInInjectionContext(abstractControlSignal);
  }
  const assertedInjector = options.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const internalState = Object.seal({
      value: signal<T>(source.getRawValue()),
      status: signal<FormControlStatus>(source.status),
      touched: signal<boolean>(source.touched),
      pristine: signal<boolean>(source.pristine),
      errors: signal<ValidationErrors | null>(source.errors)
    });

    source.events.pipe(takeUntilDestroyed()).subscribe((newEvent) => {
      if (newEvent instanceof ValueChangeEvent) {
        internalState.value.set(newEvent.value);
      }

      if (newEvent instanceof PristineChangeEvent) {
        internalState.pristine.set(newEvent.pristine);
      }

      if (newEvent instanceof TouchedChangeEvent) {
        internalState.touched.set(newEvent.touched);
      }

      if (newEvent instanceof StatusChangeEvent) {
        internalState.status.set(newEvent.status);
        internalState.errors.set(source.errors);
      }
    });

    return Object.seal({
      errors: internalState.errors.asReadonly(),
      value: internalState.value.asReadonly(),
      touched: internalState.touched.asReadonly(),
      untouched: computed(() => {
        return !internalState.touched();
      }),
      pristine: internalState.pristine.asReadonly(),
      dirty: computed(() => {
        return !internalState.pristine();
      }),
      valid: computed(() => {
        return internalState.status() === "VALID";
      }),
      invalid: computed(() => {
        return internalState.status() === "INVALID";
      }),
      pending: computed(() => {
        return internalState.status() === "PENDING";
      }),
      disabled: computed(() => {
        return internalState.status() === "DISABLED";
      })
    });
  });
}
