import { Signal, signal } from "@angular/core";

export type SignalChangeNotifier = {
  notify: () => void;
  listen: Signal<number | null>;
};

export function createSignalChangeNotifier() {
  const sourceSignal = signal<number | null>(null);

  return Object.seal({
    notify: () => {
      sourceSignal.update((v) => (v === null ? 1 : v + 1));
    },
    listen: sourceSignal.asReadonly()
  }) satisfies SignalChangeNotifier;
}
