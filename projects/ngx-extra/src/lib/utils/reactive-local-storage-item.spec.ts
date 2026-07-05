import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { z } from 'zod';
import {
  reactiveLocalStorageItem,
  type ReactiveLocalStorageItemOptions
} from './reactive-local-storage-item';

const ACCOUNTING_LOCAL_STORAGE_KEYS = {
  CURRENCY: 'accounting.currency'
} as const;

const FinancialCurrencySlimResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string()
});

type FinancialCurrencySlimResponse = z.infer<typeof FinancialCurrencySlimResponseSchema>;

const usdCurrency: FinancialCurrencySlimResponse = {
  id: 1,
  code: 'USD',
  name: 'US Dollar'
};

const CURRENCY_TTL_MS = 5_000;

function currencyCacheOptions(
  overrides?: Partial<ReactiveLocalStorageItemOptions<FinancialCurrencySlimResponse | null>>
): ReactiveLocalStorageItemOptions<FinancialCurrencySlimResponse | null> {
  return {
    parse: (val) => FinancialCurrencySlimResponseSchema.parse(val),
    ...overrides
  };
}

function createHostComponent<T>(key: string, options?: ReactiveLocalStorageItemOptions<T>) {
  @Component({ template: '', standalone: true })
  class Host {
    readonly sig = reactiveLocalStorageItem(key, options);
  }

  return Host;
}

async function createHost<T>(
  key: string,
  options?: ReactiveLocalStorageItemOptions<T>
): Promise<{
  fixture: ComponentFixture<InstanceType<ReturnType<typeof createHostComponent<T>>>>;
  sig: ReturnType<typeof reactiveLocalStorageItem<T>>;
}> {
  const Host = createHostComponent(key, options);
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.tick();
  return { fixture, sig: fixture.componentInstance.sig };
}

describe('reactiveLocalStorageItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial read', () => {
    it('returns null when storage is empty', async () => {
      const { sig } = await createHost('empty-key');
      expect(sig()).toBeNull();
    });

    it('returns defaultValue when storage is empty', async () => {
      const { sig } = await createHost('empty-default-key', { defaultValue: 'fallback' });
      expect(sig()).toBe('fallback');
    });

    it('reads existing plain JSON from storage', async () => {
      localStorage.setItem('plain-key', JSON.stringify({ count: 3 }));
      const { sig } = await createHost<{ count: number }>('plain-key');
      expect(sig()).toEqual({ count: 3 });
    });

    it('removes expired envelope on init and returns default', async () => {
      localStorage.setItem(
        'expired-key',
        JSON.stringify({
          __metadata: { expiresAt: Date.now() - 1 },
          value: 'stale'
        })
      );
      const { sig } = await createHost('expired-key', { defaultValue: 'fresh' });
      expect(sig()).toBe('fresh');
      TestBed.tick();
      expect(localStorage.getItem('expired-key')).toBe(JSON.stringify('fresh'));
    });
  });

  describe('writes', () => {
    it('persists signal value to localStorage', async () => {
      const { sig } = await createHost<string>('write-key');
      sig.set('hello');
      TestBed.tick();
      expect(localStorage.getItem('write-key')).toBe(JSON.stringify('hello'));
    });

    it('removes key when signal is set to null', async () => {
      localStorage.setItem('remove-key', JSON.stringify('old'));
      const { sig } = await createHost<string>('remove-key');
      expect(sig()).toBe('old');
      sig.set(null);
      TestBed.tick();
      expect(localStorage.getItem('remove-key')).toBeNull();
    });

    it('applies zod parse on read', async () => {
      localStorage.setItem(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        JSON.stringify(usdCurrency)
      );
      const { sig } = await createHost<FinancialCurrencySlimResponse>(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        {
          parse: (val) => FinancialCurrencySlimResponseSchema.parse(val)
        }
      );
      expect(sig()).toEqual(usdCurrency);
    });
  });

  describe('zod parse (real-world)', () => {
    it('reads cached currency from localStorage like production usage', async () => {
      localStorage.setItem(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        JSON.stringify(usdCurrency)
      );

      const { sig } = await createHost<FinancialCurrencySlimResponse>(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        {
          parse: (val) => FinancialCurrencySlimResponseSchema.parse(val)
        }
      );

      expect(sig()).toEqual(usdCurrency);
    });

    it('persists typed currency as plain JSON on write', async () => {
      const { sig } = await createHost<FinancialCurrencySlimResponse>(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        {
          parse: (val) => FinancialCurrencySlimResponseSchema.parse(val)
        }
      );

      sig.set(usdCurrency);
      TestBed.tick();

      expect(localStorage.getItem(ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY)).toBe(
        JSON.stringify(usdCurrency)
      );
    });

    it('throws when stored currency fails zod validation on init', async () => {
      localStorage.setItem(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        JSON.stringify({ id: 'bad', code: 'USD' })
      );

      await expect(
        createHost<FinancialCurrencySlimResponse>(ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY, {
          parse: (val) => FinancialCurrencySlimResponseSchema.parse(val)
        })
      ).rejects.toThrow();
    });

    it('applies zod parse on cross-tab storage sync', async () => {
      const eurCurrency: FinancialCurrencySlimResponse = {
        id: 2,
        code: 'EUR',
        name: 'Euro'
      };
      const { sig } = await createHost<FinancialCurrencySlimResponse>(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        {
          parse: (val) => FinancialCurrencySlimResponseSchema.parse(val)
        }
      );

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
          newValue: JSON.stringify(eurCurrency)
        })
      );
      TestBed.tick();

      expect(sig()).toEqual(eurCurrency);
    });

    it('does not update signal when cross-tab storage delivers invalid currency shape', async () => {
      localStorage.setItem(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        JSON.stringify(usdCurrency)
      );
      const { sig } = await createHost<FinancialCurrencySlimResponse>(
        ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
        {
          parse: (val) => FinancialCurrencySlimResponseSchema.parse(val)
        }
      );
      expect(sig()).toEqual(usdCurrency);

      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener('error', onError);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
          newValue: JSON.stringify({ id: 'bad', code: 'USD' })
        })
      );
      TestBed.tick();

      window.removeEventListener('error', onError);

      expect(errors[0]).toBeInstanceOf(z.ZodError);
      expect(sig()).toEqual(usdCurrency);
    });

    describe('with ttlMs 5s', () => {
      it('stores currency in TTL envelope when written', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
        try {
          const { sig } = await createHost<FinancialCurrencySlimResponse | null>(
            ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
            currencyCacheOptions({ ttlMs: CURRENCY_TTL_MS })
          );

          sig.set(usdCurrency);
          TestBed.tick();

          const stored = JSON.parse(localStorage.getItem(ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY)!);
          expect(stored.value).toEqual(usdCurrency);
          expect(stored.__metadata.expiresAt).toBe(Date.now() + CURRENCY_TTL_MS);
        } finally {
          vi.useRealTimers();
        }
      });

      it('reads valid TTL envelope and parses currency with zod on init', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
        try {
          const expiresAt = Date.now() + CURRENCY_TTL_MS;
          localStorage.setItem(
            ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
            JSON.stringify({
              __metadata: { expiresAt },
              value: usdCurrency
            })
          );

          const { sig } = await createHost<FinancialCurrencySlimResponse | null>(
            ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
            currencyCacheOptions({ ttlMs: CURRENCY_TTL_MS })
          );

          expect(sig()).toEqual(usdCurrency);
        } finally {
          vi.useRealTimers();
        }
      });

      it('expires currency cache after 5 seconds', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
        try {
          const { sig } = await createHost<FinancialCurrencySlimResponse | null>(
            ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
            currencyCacheOptions({ ttlMs: CURRENCY_TTL_MS, defaultValue: null })
          );

          sig.set(usdCurrency);
          TestBed.tick();

          vi.advanceTimersByTime(CURRENCY_TTL_MS + 1);
          TestBed.tick();

          expect(sig()).toBeNull();
          expect(localStorage.getItem(ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY)).toBeNull();
        } finally {
          vi.useRealTimers();
        }
      });

      it('removes expired TTL envelope on init and returns default', async () => {
        localStorage.setItem(
          ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
          JSON.stringify({
            __metadata: { expiresAt: Date.now() - 1 },
            value: usdCurrency
          })
        );

        const { sig } = await createHost<FinancialCurrencySlimResponse | null>(
          ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
          currencyCacheOptions({ ttlMs: CURRENCY_TTL_MS, defaultValue: null })
        );

        expect(sig()).toBeNull();
        TestBed.tick();
        expect(localStorage.getItem(ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY)).toBeNull();
      });

      it('applies zod parse on cross-tab TTL envelope sync', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
        try {
          const eurCurrency: FinancialCurrencySlimResponse = {
            id: 2,
            code: 'EUR',
            name: 'Euro'
          };
          const expiresAt = Date.now() + CURRENCY_TTL_MS;
          const { sig } = await createHost<FinancialCurrencySlimResponse | null>(
            ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
            currencyCacheOptions({ ttlMs: CURRENCY_TTL_MS, defaultValue: null })
          );

          window.dispatchEvent(
            new StorageEvent('storage', {
              key: ACCOUNTING_LOCAL_STORAGE_KEYS.CURRENCY,
              newValue: JSON.stringify({
                __metadata: { expiresAt },
                value: eurCurrency
              })
            })
          );
          TestBed.tick();

          expect(sig()).toEqual(eurCurrency);
        } finally {
          vi.useRealTimers();
        }
      });
    });
  });

  describe('ttl', () => {
    it('stores TTL envelope when ttlMs is set', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      try {
        const { sig } = await createHost('ttl-write-key', { ttlMs: 5000 });
        sig.set('cached');
        TestBed.tick();

        const stored = JSON.parse(localStorage.getItem('ttl-write-key')!);
        expect(stored.value).toBe('cached');
        expect(stored.__metadata.expiresAt).toBe(Date.now() + 5000);
      } finally {
        vi.useRealTimers();
      }
    });

    it('expires value after ttl via timer', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      try {
        const { sig } = await createHost<string | null>('ttl-expire-key', {
          ttlMs: 1000,
          defaultValue: null
        });
        sig.set('live');
        TestBed.tick();

        vi.advanceTimersByTime(1001);
        TestBed.tick();

        expect(sig()).toBeNull();
        expect(localStorage.getItem('ttl-expire-key')).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('cross-tab sync', () => {
    it('updates signal when storage event fires from another tab', async () => {
      const { sig } = await createHost<string>('sync-key', { defaultValue: 'default' });
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'sync-key',
          newValue: JSON.stringify('remote')
        })
      );
      TestBed.tick();
      expect(sig()).toBe('remote');
    });

    it('resets to default when storage event clears the key', async () => {
      const { sig } = await createHost<string>('sync-clear-key', { defaultValue: 'default' });
      sig.set('local');
      TestBed.tick();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'sync-clear-key',
          newValue: null
        })
      );
      TestBed.tick();
      expect(sig()).toBe('default');
    });

    it('ignores storage events when syncAcrossTabs is false', async () => {
      const { sig } = await createHost<string>('no-sync-key', {
        defaultValue: 'local',
        syncAcrossTabs: false
      });
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'no-sync-key',
          newValue: JSON.stringify('remote')
        })
      );
      TestBed.tick();
      expect(sig()).toBe('local');
    });
  });

  describe('cleanup', () => {
    it('stops reacting to storage events after fixture destroy', async () => {
      const { fixture, sig } = await createHost<string>('cleanup-sync-key', {
        defaultValue: 'local'
      });
      fixture.destroy();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'cleanup-sync-key',
          newValue: JSON.stringify('remote')
        })
      );
      TestBed.tick();
      expect(sig()).toBe('local');
    });

    it('stops expiry timer after fixture destroy', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      try {
        const { fixture, sig } = await createHost<string | null>('cleanup-ttl-key', {
          ttlMs: 1000,
          defaultValue: null
        });
        sig.set('live');
        TestBed.tick();
        fixture.destroy();

        vi.advanceTimersByTime(2000);
        TestBed.tick();
        expect(sig()).toBe('live');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
