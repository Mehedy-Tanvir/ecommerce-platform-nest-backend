import { CacheService } from 'src/modules/cache/cache.service';
import { Cacheable } from 'src/common/decorators/cacheable.decorator';

interface CacheServiceMock {
  getOrSet: jest.Mock;
  invalidate: jest.Mock;
}

function mockCacheService(): CacheServiceMock {
  const instance: CacheServiceMock = {
    getOrSet: jest.fn(),
    invalidate: jest.fn().mockResolvedValue(undefined),
  };
  CacheService.setInstance(instance as unknown as CacheService);
  return instance;
}

describe('@Cacheable', () => {
  afterEach(() => {
    CacheService.setInstance(undefined);
    jest.clearAllMocks();
  });

  it('calls CacheService.getOrSet with an auto-generated key and default ttl', async () => {
    const cache = mockCacheService();
    cache.getOrSet.mockImplementation(async (_k, _t, fn) => fn());

    class Service {
      @Cacheable()
      async find(id: number): Promise<number> {
        return id * 2;
      }
    }

    const result = await new Service().find(21);

    expect(result).toBe(42);
    expect(cache.getOrSet).toHaveBeenCalledTimes(1);
    const [key, ttl, factory] = cache.getOrSet.mock.calls[0];
    expect(ttl).toBe(60);
    expect(key).toContain('Service.find');
    expect(key).toContain('[21]');
    expect(await factory()).toBe(42);
  });

  it('uses the explicit key and custom ttl when provided', async () => {
    const cache = mockCacheService();
    cache.getOrSet.mockImplementation(async (_k, _t, fn) => fn());

    class Service {
      @Cacheable({ key: 'products:featured', ttl: 120 })
      async featured(): Promise<string> {
        return 'data';
      }
    }

    await new Service().featured();

    const [key, ttl] = cache.getOrSet.mock.calls[0];
    expect(key).toBe('products:featured');
    expect(ttl).toBe(120);
  });

  it('uses the custom prefix in the auto-generated key', async () => {
    const cache = mockCacheService();
    cache.getOrSet.mockImplementation(async (_k, _t, fn) => fn());

    class Catalog {
      @Cacheable({ prefix: 'catalog', ttl: 30 })
      async list(): Promise<string> {
        return 'items';
      }
    }

    await new Catalog().list();

    const [key] = cache.getOrSet.mock.calls[0];
    expect(key).toContain('catalog.list');
  });

  it('falls back to the original method when no CacheService instance exists', async () => {
    CacheService.setInstance(undefined);

    class Service {
      @Cacheable()
      async value(): Promise<number> {
        return 7;
      }
    }

    await expect(new Service().value()).resolves.toBe(7);
  });

  it('works with synchronous methods', async () => {
    const cache = mockCacheService();
    cache.getOrSet.mockImplementation(async (_k, _t, fn) => fn());

    class Service {
      @Cacheable({ key: 'sync' })
      compute(): number {
        return 99;
      }
    }

    await expect(new Service().compute()).resolves.toBe(99);
  });

  it('throws when applied to a non-method property', () => {
    const decorator = Cacheable();
    const descriptor = { value: 1 } as unknown as PropertyDescriptor;

    expect(() => decorator({}, 'value', descriptor)).toThrow(
      /@Cacheable must be applied to a method/,
    );
  });
});
