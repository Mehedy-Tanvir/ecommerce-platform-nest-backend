import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: Cache;

  const mockClient = {
    scan: jest.fn(),
  };

  const buildCacheManager = (store: any): Cache =>
    ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn(),
      stores: [{ store }],
    }) as unknown as Cache;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: buildCacheManager({ client: mockClient }),
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('getOrSet', () => {
    it('returns cached value on cache hit without calling factory', async () => {
      const cached = { id: 1 };
      (cacheManager.get as jest.Mock).mockResolvedValue(cached);
      const factory = jest.fn().mockResolvedValue({ id: 2 });

      const result = await service.getOrSet('key', 60, factory);

      expect(result).toEqual(cached);
      expect(factory).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('calls factory and caches result on cache miss', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(undefined);
      const fresh = { id: 3 };
      const factory = jest.fn().mockResolvedValue(fresh);

      const result = await service.getOrSet('key', 60, factory);

      expect(result).toEqual(fresh);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith('key', fresh, 60);
    });

    it('propagates factory errors and does not cache', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(undefined);
      const factory = jest.fn().mockRejectedValue(new Error('boom'));

      await expect(service.getOrSet('key', 60, factory)).rejects.toThrow(
        'boom',
      );
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('skips caching when ttl is 0', async () => {
      const fresh = { id: 4 };
      const factory = jest.fn().mockResolvedValue(fresh);

      const result = await service.getOrSet('key', 0, factory);

      expect(result).toEqual(fresh);
      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('deletes keys matching the pattern via SCAN', async () => {
      mockClient.scan
        .mockResolvedValueOnce(['5', ['products:1', 'products:2']])
        .mockResolvedValueOnce(['0', []]);

      await service.invalidate('products:*');

      expect(mockClient.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'products:*',
        'COUNT',
        100,
      );
      expect(cacheManager.del).toHaveBeenCalledWith('products:1');
      expect(cacheManager.del).toHaveBeenCalledWith('products:2');
    });

    it('warns and returns on invalid pattern without crashing', async () => {
      await service.invalidate('');

      expect(mockClient.scan).not.toHaveBeenCalled();
    });

    it('warns and returns when redis client is unavailable', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: CACHE_MANAGER,
            useValue: buildCacheManager({}),
          },
        ],
      }).compile();
      const localService = module.get<CacheService>(CacheService);

      await expect(
        localService.invalidate('products:*'),
      ).resolves.toBeUndefined();
    });
  });

  describe('reset', () => {
    it('clears the entire cache', async () => {
      await service.reset();
      expect((cacheManager as any).clear).toHaveBeenCalled();
    });
  });
});
