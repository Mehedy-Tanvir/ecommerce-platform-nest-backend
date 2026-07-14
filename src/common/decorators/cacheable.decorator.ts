import 'reflect-metadata';
import { CacheService } from 'src/modules/cache/cache.service';
import { CACHEABLE_METADATA } from 'src/common/decorators/cache.constants';

export interface CacheableOptions {
  /** Explicit cache key. When omitted, a key is auto-generated. */
  key?: string;
  /** Time-to-live in seconds. Defaults to 60. Use 0 to bypass caching. */
  ttl?: number;
  /** Optional prefix prepended to auto-generated keys. */
  prefix?: string;
}

const DEFAULT_TTL = 60;

/**
 * Declaratively caches the return value of a method.
 *
 * The decorator wraps the method so that, on each call, the result is served
 * from `CacheService` when present, otherwise the original method runs and its
 * result is stored. It works on both controller route handlers and plain
 * service methods (unlike an interceptor, which only fires for controllers).
 *
 * @example
 * ```ts
 * // Auto-generated key from class/method/args, 60s TTL
 * @Cacheable()
 * async findAll() { ... }
 *
 * // Explicit key, 120s TTL
 * @Cacheable({ key: 'products:featured', ttl: 120 })
 * async getFeatured() { ... }
 *
 * // Custom prefix
 * @Cacheable({ prefix: 'catalog', ttl: 30 })
 * async listCategories() { ... }
 * ```
 *
 * Auto-generated keys take the form
 * `${prefix ?? ClassName}.${methodName}:${JSON.stringify(args)}`.
 */
export function Cacheable(options: CacheableOptions = {}): MethodDecorator {
  const ttl = options.ttl ?? DEFAULT_TTL;

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const originalMethod = descriptor?.value;

    if (!descriptor || typeof originalMethod !== 'function') {
      throw new Error(
        `@Cacheable must be applied to a method, but "${String(propertyKey)}" is not a function.`,
      );
    }

    const className = target.constructor.name;

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const cacheService = CacheService.getInstance();
      if (!cacheService) {
        return originalMethod.apply(this, args) as Promise<unknown>;
      }

      const key =
        options.key ??
        `${options.prefix ?? className}.${String(propertyKey)}:${JSON.stringify(args)}`;

      return cacheService.getOrSet(
        key,
        ttl,
        () => originalMethod.apply(this, args) as unknown,
      );
    };

    Reflect.defineMetadata(CACHEABLE_METADATA, options, descriptor.value);

    return descriptor;
  };
}
