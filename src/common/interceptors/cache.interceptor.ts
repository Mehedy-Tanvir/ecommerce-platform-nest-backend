import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { from, firstValueFrom } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Request } from 'express';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  CACHEABLE_METADATA,
  CACHE_INVALIDATE_METADATA,
} from 'src/common/decorators/cache.constants';
import type { CacheableOptions } from 'src/common/decorators/cacheable.decorator';
import type { CacheInvalidatePattern } from 'src/common/decorators/cache-invalidate.decorator';

/**
 * Controller-level caching interceptor. Pair it with `@Cacheable()` (which only
 * sets metadata) or apply it directly through `@UseInterceptors`.
 *
 * Unlike the `@Cacheable` method decorator, this only fires for routed handlers
 * (controllers, gateways), but it participates in the full NestJS interceptor
 * pipeline and is the idiomatic choice when caching route responses.
 */
@Injectable()
export class CacheableInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.getOptions(context);
    if (!options) {
      return next.handle();
    }

    const ttl = options.ttl ?? 60;
    const key = this.resolveKey(context, options);

    return from(
      this.cacheService.getOrSet(key, ttl, () => firstValueFrom(next.handle())),
    );
  }

  private getOptions(context: ExecutionContext): CacheableOptions | undefined {
    return Reflect.getMetadata(CACHEABLE_METADATA, context.getHandler()) as
      | CacheableOptions
      | undefined;
  }

  private resolveKey(
    context: ExecutionContext,
    options: CacheableOptions,
  ): string {
    if (options.key) {
      return options.key;
    }

    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      return `${options.prefix ?? className}.${methodName}:${request.method}:${request.originalUrl}`;
    }

    const args = context.getArgs();
    return `${options.prefix ?? className}.${methodName}:${JSON.stringify(args)}`;
  }
}

/**
 * Controller-level cache invalidation interceptor. Pair it with
 * `@CacheInvalidate()` (which only sets metadata) or apply directly via
 * `@UseInterceptors`.
 */
@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const pattern = this.getPattern(context);
    if (!pattern) {
      return next.handle();
    }

    return next.handle().pipe(
      concatMap(async (result) => {
        const resolved =
          typeof pattern === 'function'
            ? pattern(result, ...context.getArgs())
            : pattern;
        await this.cacheService.invalidate(resolved);
        return result as unknown;
      }),
    );
  }

  private getPattern(
    context: ExecutionContext,
  ): CacheInvalidatePattern | undefined {
    return Reflect.getMetadata(
      CACHE_INVALIDATE_METADATA,
      context.getHandler(),
    ) as CacheInvalidatePattern | undefined;
  }
}
