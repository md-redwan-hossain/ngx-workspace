import { signal } from "@angular/core";

export function createSignalChangeNotifier() {
  const sourceSignal = signal<number | null>(null);

  return {
    notify: () => {
      sourceSignal.update((v) => (v === null ? 1 : v + 1));
    },
    listen: sourceSignal.asReadonly()
  };
}
