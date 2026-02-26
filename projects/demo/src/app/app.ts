import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { abstractControlSignal } from 'ngx-extra';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [ReactiveFormsModule],
})
export class App {
  fb = inject(FormBuilder);

  tracker = signal(false);

  form = this.fb.group({
    userName: this.fb.control<string | null>(null, Validators.required),
  });

  formState = abstractControlSignal(this.form);
  userNameState = abstractControlSignal(this.form.controls.userName);

  onFormReset() {
    this.form.reset();
    this.tracker.set(true);
  }

  constructor() {
    effect(() => {
      console.log('form reset', this.formState.reset());
    });

    effect(() => {
      console.log('username reset', this.userNameState.reset());
    });

    effect(() => {
      console.log('tracker', this.tracker());
    });
  }
}
