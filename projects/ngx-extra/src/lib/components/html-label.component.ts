import { Component, input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "ngx-html-label",
  standalone: true,
  template: `
    <label [for]="bindFor()" [class]="bindCssClass()">
      <ng-content select=".before-html-label"></ng-content>
      {{ bindValue() }}
      @if (bindRequired()) {
        <span class="text-red-500">*</span>
      }
      <ng-content select=".after-html-label"></ng-content>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HtmlLabelComponent {
  readonly bindFor = input.required<string>();
  readonly bindValue = input.required<string>();
  readonly bindCssClass = input<string>("");
  readonly bindRequired = input<boolean>();
}
