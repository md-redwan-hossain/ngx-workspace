import { DestroyRef, Directive, Input, TemplateRef, ViewContainerRef } from "@angular/core";
import { AbstractControl, ValidationErrors } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { merge, Subscription } from "rxjs";

interface ErrorContext {
  $implicit: ValidationErrors | null;
  control: AbstractControl;
}

@Directive({
  selector: "[ToggleValidationErrorArea]",
  standalone: true
})
export class ToggleValidationErrorAreaDirective {
  constructor(
    private readonly templateRef: TemplateRef<ErrorContext>,
    private readonly viewContainer: ViewContainerRef,
    private readonly destroyRef: DestroyRef
  ) {}

  private hasView = false;
  private subscription: Subscription | null = null;

  @Input({ required: true }) set ToggleValidationErrorArea(control: AbstractControl) {
    if (!control) return;

    this.subscription?.unsubscribe();
    this.subscription = merge(control.statusChanges, control.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateView(control));

    this.updateView(control);
  }

  static ngTemplateContextGuard(
    _dir: ToggleValidationErrorAreaDirective,
    ctx: unknown
  ): ctx is ErrorContext {
    return true;
  }

  private updateView(control: AbstractControl) {
    const hasError = control.invalid && (control.dirty || control.touched);

    if (hasError && !this.hasView) {
      this.viewContainer.createEmbeddedView<ErrorContext>(this.templateRef, {
        $implicit: control.errors,
        control
      });
      this.hasView = true;
    } else if (!hasError && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
