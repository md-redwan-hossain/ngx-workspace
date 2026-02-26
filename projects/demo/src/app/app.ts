import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormResetEvent, ReactiveFormsModule, Validators } from '@angular/forms';

import { abstractControlSignal } from 'ngx-extra';
import { filter, map, of, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [ReactiveFormsModule],
})
export class App {
  fb = inject(FormBuilder);

  form = this.fb.group({
    userName: this.fb.control<string | null>(null, Validators.required),
    phone: this.fb.control<string | null>(null, Validators.required),
  });

  formState = abstractControlSignal(this.form);
  userNameState = abstractControlSignal(this.form.controls.userName);

  onFormReset() {
    this.form.reset();
  }

  constructor() {
    effect(() => {
      console.log('form dirty', this.formState.dirty());
    });

    effect(() => {
      console.log('form reset', this.formState.reset());
    });

    // effect(() => {
    //   console.log('username reset', this.userNameState.reset());
    // });
  }
}
