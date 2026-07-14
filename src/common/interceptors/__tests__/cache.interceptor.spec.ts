import { of, firstValueFrom } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  CacheableInterceptor,
  CacheInvalidateInterceptor,
} from 'src/common/interceptors/cache.interceptor';
import {
  CACHEABLE_METADATA,
  CACHE_INVALIDATE_METADATA,
} from 'src/common/decorators/cache.constants';

function makeContext(
  metadataKey: string,
  metadataValue: unknown,
  args: unknown[] = [],
  type: string = 'rpc',
): ExecutionContext {
  const handler: any = () => undefined;
  Reflect.defineMetadata(metadataKey, metadataValue, handler);

  const context = {
    getClass: () => ({ name: 'CatalogController' }),
    getHandler: () => handler,
    getType: () => type,
    getArgs: () => args,
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', originalUrl: '/products' }),
    }),
  } as unknown as ExecutionContext;

  return context;
}

function makeHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('CacheableInterceptor', () => {
  it('caches the handler result via CacheService.getOrSet', async () => {
    const getOrSet = jest
      .fn()
      .mockImplementation(async (_k: string, _t: number, fn: () => unknown) =>
        fn(),
      );
    const cacheService = {
      getOrSet,
      invalidate: jest.fn(),
    } as unknown as CacheService;

    const interceptor = new CacheableInterceptor(cacheService);
    const context = makeContext(CACHEABLE_METADATA, { ttl: 60 }, [1, 2]);
    const next = makeHandler('payload');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('payload');
    expect(getOrSet).toHaveBeenCalledTimes(1);
    const [key, ttl] = getOrSet.mock.calls[0];
    expect(ttl).toBe(60);
    expect(key).toContain('CatalogController');
  });

  it('passes through when no cacheable metadata is present', async () => {
    const getOrSet = jest.fn();
    const cacheService = {
      getOrSet,
    } as unknown as CacheService;

    const interceptor = new CacheableInterceptor(cacheService);
    const context = makeContext('other', {}, []);
    const next = makeHandler('raw');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('raw');
    expect(getOrSet).not.toHaveBeenCalled();
  });
});

describe('CacheInvalidateInterceptor', () => {
  it('invalidates with a static pattern after the handler resolves', async () => {
    const invalidate = jest.fn().mockResolvedValue(undefined);
    const cacheService = {
      invalidate,
    } as unknown as CacheService;

    const interceptor = new CacheInvalidateInterceptor(cacheService);
    const context = makeContext(CACHE_INVALIDATE_METADATA, 'products:*', []);
    const next = makeHandler('ok');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
    expect(invalidate).toHaveBeenCalledWith('products:*');
  });

  it('resolves a dynamic pattern from the handler result and args', async () => {
    const invalidate = jest.fn().mockResolvedValue(undefined);
    const cacheService = {
      invalidate,
    } as unknown as CacheService;

    const interceptor = new CacheInvalidateInterceptor(cacheService);
    const context = makeContext(
      CACHE_INVALIDATE_METADATA,
      (result: unknown, id: number) => `products:${id}:${result}`,
      [7],
    );
    const next = makeHandler('done');

    await firstValueFrom(interceptor.intercept(context, next));

    expect(invalidate).toHaveBeenCalledWith('products:7:done');
  });

  it('passes through when no invalidate metadata is present', async () => {
    const invalidate = jest.fn();
    const cacheService = {
      invalidate,
    } as unknown as CacheService;

    const interceptor = new CacheInvalidateInterceptor(cacheService);
    const context = makeContext('other', {}, []);
    const next = makeHandler('raw');

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('raw');
    expect(invalidate).not.toHaveBeenCalled();
  });
});
