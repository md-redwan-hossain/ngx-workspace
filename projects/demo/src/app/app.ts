import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
  });

  formState = abstractControlSignal();
}
