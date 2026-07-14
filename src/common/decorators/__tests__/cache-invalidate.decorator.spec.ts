import { CacheService } from 'src/modules/cache/cache.service';
import { CacheInvalidate } from 'src/common/decorators/cache-invalidate.decorator';

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

describe('@CacheInvalidate', () => {
  afterEach(() => {
    CacheService.setInstance(undefined);
    jest.clearAllMocks();
  });

  it('invalidates with a static pattern after the method resolves', async () => {
    const cache = mockCacheService();

    class Service {
      @CacheInvalidate('products:*')
      async update(): Promise<string> {
        return 'ok';
      }
    }

    const result = await new Service().update();

    expect(result).toBe('ok');
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
    expect(cache.invalidate).toHaveBeenCalledWith('products:*');
  });

  it('resolves a dynamic pattern function with (result, ...args)', async () => {
    const cache = mockCacheService();

    class Service {
      @CacheInvalidate((result, id: number) => `products:${id}:${result}`)
      async update(id: number): Promise<string> {
        return 'done';
      }
    }

    await new Service().update(42);

    expect(cache.invalidate).toHaveBeenCalledWith('products:42:done');
  });

  it('still returns the original result when no CacheService instance exists', async () => {
    CacheService.setInstance(undefined);

    class Service {
      @CacheInvalidate('products:*')
      async update(): Promise<number> {
        return 5;
      }
    }

    await expect(new Service().update()).resolves.toBe(5);
    expect(CacheService.getInstance()).toBeUndefined();
  });

  it('runs the original method before invalidation', async () => {
    const cache = mockCacheService();
    const order: string[] = [];

    class Service {
      @CacheInvalidate('k')
      async run(): Promise<void> {
        order.push('method');
      }
    }

    await new Service().run();
    order.push('invalidate');

    expect(order).toEqual(['method', 'invalidate']);
  });

  it('throws when applied to a non-method property', () => {
    const decorator = CacheInvalidate('k');
    const descriptor = { value: 1 } as unknown as PropertyDescriptor;

    expect(() => decorator({}, 'value', descriptor)).toThrow(
      /@CacheInvalidate must be applied to a method/,
    );
  });
});
