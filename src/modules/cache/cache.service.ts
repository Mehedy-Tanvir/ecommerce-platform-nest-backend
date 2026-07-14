import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  /**
   * Holds the singleton instance injected by NestJS DI. Decorators use this to
   * resolve `CacheService` at runtime without depending on method arguments.
   */
  private static instance: CacheService | undefined;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    CacheService.instance = this;
  }

  /** Returns the active `CacheService` instance (set on construction). */
  static getInstance(): CacheService | undefined {
    return CacheService.instance;
  }

  /** Overrides the active instance. Primarily used by tests. */
  static setInstance(instance: CacheService | undefined): void {
    CacheService.instance = instance;
  }

  async getOrSet<T>(
    key: string,
    ttl: number,
    factoryFn: () => Promise<T>,
  ): Promise<T> {
    if (ttl === 0) {
      return factoryFn();
    }

    const cached = await this.cacheManager.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    try {
      const result = await factoryFn();
      await this.cacheManager.set(key, result, ttl);
      return result;
    } catch (error) {
      this.logger.error(
        `factoryFn failed for key "${key}", skipping cache`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!pattern || typeof pattern !== 'string') {
      this.logger.warn(`Invalid invalidate pattern: ${pattern}`);
      return;
    }

    const client = (this.cacheManager.store as any)?.client;
    if (!client || typeof client.scan !== 'function') {
      this.logger.warn(
        'Underlying redis client not available; cannot invalidate by pattern',
      );
      return;
    }

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          await Promise.all(keys.map((k: string) => this.cacheManager.del(k)));
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.error(
        `Failed to invalidate pattern "${pattern}"`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }
}
