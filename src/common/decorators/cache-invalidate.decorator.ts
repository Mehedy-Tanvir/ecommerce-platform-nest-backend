import 'reflect-metadata';
import { CacheService } from 'src/modules/cache/cache.service';
import { CACHE_INVALIDATE_METADATA } from 'src/common/decorators/cache.constants';

/**
 * Resolves a cache invalidation pattern. When a function is supplied it receives
 * `(result, ...args)` so the pattern can be derived from the method's outcome
 * or arguments.
 */
export type CacheInvalidatePattern =
  | string
  | ((result: unknown, ...args: unknown[]) => string);

/**
 * Declaratively invalidates cache entries after a mutation method executes.
 *
 * The decorator wraps the method so the original method always runs first; once
 * it resolves (or rejects is not swallowed — only a successful result triggers
 * invalidation), `CacheService.invalidate(pattern)` is called with the resolved
 * pattern. Works on both controller route handlers and plain service methods.
 *
 * @example
 * ```ts
 * // Static pattern
 * @CacheInvalidate('products:*')
 * async updateMany() { ... }
 *
 * // Dynamic pattern from arguments
 * @CacheInvalidate((_result, id) => `products:${id}`)
 * async update(id: string) { ... }
 *
 * // Dynamic pattern from the returned result
 * @CacheInvalidate((result) => `orders:${(result as any).id}`)
 * async create(dto: CreateOrderDto) { ... }
 * ```
 */
export function CacheInvalidate(
  pattern: CacheInvalidatePattern,
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const originalMethod = descriptor?.value;

    if (!descriptor || typeof originalMethod !== 'function') {
      throw new Error(
        `@CacheInvalidate must be applied to a method, but "${String(propertyKey)}" is not a function.`,
      );
    }

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const result = await originalMethod.apply(this, args);

      const cacheService = CacheService.getInstance();
      if (cacheService) {
        const resolved =
          typeof pattern === 'function' ? pattern(result, ...args) : pattern;
        await cacheService.invalidate(resolved);
      }

      return result as unknown;
    };

    Reflect.defineMetadata(
      CACHE_INVALIDATE_METADATA,
      pattern,
      descriptor.value,
    );

    return descriptor;
  };
}
