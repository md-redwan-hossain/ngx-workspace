import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Injector,
  isDevMode,
  runInInjectionContext,
  signal,
  type WritableSignal
} from "@angular/core";

type StorageEnvelope<T> = {
  __metadata: { expiresAt: number };
  value: T;
};

type ParsedStorage =
  | { kind: "plain"; raw: unknown }
  | { kind: "valid"; value: unknown; expiresAt?: number }
  | { kind: "expired" };

export type ReactiveLocalStorageItemOptions<T> = {
  defaultValue?: T;
  parse?: (raw: unknown) => T;
  syncAcrossTabs?: boolean;
  injector?: Injector;
  /** TTL in milliseconds. Must be specified to enable expiry; omit for plain JSON storage. */
  ttlMs?: number;
};

function isStorageEnvelope(parsed: unknown): parsed is StorageEnvelope<unknown> {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "__metadata" in parsed &&
    typeof (parsed as StorageEnvelope<unknown>).__metadata.expiresAt === "number" &&
    "value" in parsed
  );
}

function parseStoredValue(parsed: unknown): ParsedStorage {
  if (!isStorageEnvelope(parsed)) {
    return { kind: "plain", raw: parsed };
  }

  if (parsed.__metadata.expiresAt < Date.now()) {
    return { kind: "expired" };
  }

  return { kind: "valid", value: parsed.value, expiresAt: parsed.__metadata.expiresAt };
}

function applyParse<T>(value: unknown, parse?: (raw: unknown) => T): T | null {
  if (parse) {
    return parse(value);
  }
  return value as T;
}

export function reactiveLocalStorageItem<T>(
  key: string,
  opts?: ReactiveLocalStorageItemOptions<T>
): WritableSignal<T | null> {
  if (isDevMode() && !opts?.injector) {
    assertInInjectionContext(reactiveLocalStorageItem);
  }

  const assertedInjector = opts?.injector ?? inject(Injector);
  const ttlEnabled = opts?.ttlMs != null;

  return runInInjectionContext(assertedInjector, () => {
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const destroyRef =
      ttlEnabled || opts?.syncAcrossTabs !== false ? inject(DestroyRef) : undefined;

    const clearExpiryTimer = () => {
      if (expiryTimer !== undefined) {
        clearTimeout(expiryTimer);
        expiryTimer = undefined;
      }
    };

    if (destroyRef && ttlEnabled) {
      destroyRef.onDestroy(clearExpiryTimer);
    }

    let sig!: WritableSignal<T | null>;

    const expireItem = () => {
      clearExpiryTimer();
      localStorage.removeItem(key);
      sig.set(opts?.defaultValue ?? null);
    };

    const scheduleExpiry = (expiresAt: number) => {
      if (!ttlEnabled) {
        return;
      }

      clearExpiryTimer();
      const delay = expiresAt - Date.now();
      if (delay <= 0) {
        expireItem();
        return;
      }

      expiryTimer = setTimeout(() => expireItem(), delay);
    };

    const readFromStorage = (): T | null => {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return opts?.defaultValue ?? null;
      }

      const parsed = parseStoredValue(JSON.parse(raw));

      if (parsed.kind === "expired") {
        localStorage.removeItem(key);
        return opts?.defaultValue ?? null;
      }

      if (parsed.kind === "valid" && parsed.expiresAt !== undefined) {
        scheduleExpiry(parsed.expiresAt);
        return applyParse(parsed.value, opts?.parse);
      }

      return applyParse(parsed.kind === "plain" ? parsed.raw : parsed.value, opts?.parse);
    };

    const writeToStorage = (value: T | null | undefined) => {
      if (value === null || value === undefined) {
        clearExpiryTimer();
        localStorage.removeItem(key);
        return;
      }

      if (!ttlEnabled) {
        localStorage.setItem(key, JSON.stringify(value));
        return;
      }

      const expiresAt = Date.now() + opts!.ttlMs!;
      const envelope: StorageEnvelope<T> = {
        __metadata: { expiresAt },
        value
      };
      localStorage.setItem(key, JSON.stringify(envelope));
      scheduleExpiry(expiresAt);
    };

    sig = signal<T | null>(readFromStorage());

    effect(() => {
      writeToStorage(sig());
    });

    if (opts?.syncAcrossTabs !== false && destroyRef) {
      const onStorageChange = (event: StorageEvent) => {
        if (event.key !== key) {
          return;
        }

        if (event.newValue === null) {
          clearExpiryTimer();
          sig.set(opts?.defaultValue ?? null);
          return;
        }

        const parsed = parseStoredValue(JSON.parse(event.newValue));

        if (parsed.kind === "expired") {
          expireItem();
          return;
        }

        if (parsed.kind === "valid" && parsed.expiresAt !== undefined) {
          scheduleExpiry(parsed.expiresAt);
          sig.set(applyParse(parsed.value, opts?.parse));
          return;
        }

        sig.set(applyParse(parsed.kind === "plain" ? parsed.raw : parsed.value, opts?.parse));
      };

      window.addEventListener("storage", onStorageChange);
      destroyRef.onDestroy(() => window.removeEventListener("storage", onStorageChange));
    }

    return sig;
  });
}
