import { Signal, signal } from "@angular/core";

/**
 * A small notifier that exposes a readonly signal which increments when
 * `notify()` is called. Consumers can subscribe to `listen` to detect
 * changes (the value is a monotonically increasing counter or `null`).
 */
export type SignalChangeNotifier = {
  /**
   * Triggers a change notification. Each call increments the internal counter.
   */
  notify: () => void;
  /**
   * Readonly signal that yields the current counter value or `null` before
   * the first notification. Useful for change detection and subscriptions.
   */
  listen: Signal<number | null>;
};

/**
 * Creates a `SignalChangeNotifier`.
 *
 * Usage:
 * - Call `notify()` whenever you want listeners to react to a change.
 * - Read `listen` readonly signal from components or services to respond.
 *
 * The implementation uses a numeric counter so consumers can detect repeated
 * notifications and ignore identical updates if needed.
 */
export function createSignalChangeNotifier() {
  const sourceSignal = signal<number | null>(null);

  return Object.seal({
    notify: () => {
      sourceSignal.update((v) => (v === null ? 1 : v + 1));
    },
    listen: sourceSignal.asReadonly()
  }) satisfies SignalChangeNotifier;
}
