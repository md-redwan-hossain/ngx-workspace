import { Component, computed, input, ChangeDetectionStrategy } from "@angular/core";
import { FormControl } from "@angular/forms";
import { KeyValuePipe } from "@angular/common";

@Component({
  selector: "ngx-reactive-form-error-message",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KeyValuePipe],
  template: `
    @for (item of finalErrorsWithCodeAndMessage() | keyvalue; track item.key) {
      @if (formControlToBind().errors?.[item.key]) {
        <small [class]="cssClass()">{{ item.value }}</small>
      }
    }
  `
})
export class ReactiveFormErrorMessageComponent {
  readonly formControlToBind = input.required<FormControl>();
  readonly formControlLabel = input.required<string>();
  readonly cssClass = input<string>("");
  readonly customErrors = input<Record<string, string>>();

  protected readonly finalErrorsWithCodeAndMessage = computed(() => {
    const label = this.formControlLabel();
    const customKv = this.customErrors() ?? {};

    return {
      required: `${label} is required.`,
      maxlength: `${label} must be smaller.`,
      minlength: `${label} must be bigger.`,
      min: `${label} must be bigger.`,
      max: `${label} must be smaller.`,
      email: `${label} must be a valid email.`,
      pattern: `${label} is not valid.`,
      ...customKv
    };
  });
}
