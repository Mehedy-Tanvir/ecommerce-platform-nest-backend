/* In-memory stand-in for `cache-manager-redis-yet` used by E2E tests so they
 * don't require a running Redis instance. Exposes the same shape the app
 * expects from `redisStore`. */

function createMemoryStore() {
  const store = new Map<string, any>();

  const storeObj: any = {
    name: 'memory',
    get: async (key: string) => store.get(key),
    set: async (key: string, value: any) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
    mget: async (...keys: string[]) => keys.map((k) => store.get(k)),
    mset: async (...args: [string, any][]) => {
      for (const [k, v] of args) store.set(k, v);
    },
    reset: async () => {
      store.clear();
    },
    clear: async () => {
      store.clear();
    },
    keys: async () => [...store.keys()],
    client: {
      scan: async () => ['0', []],
    },
  };

  return storeObj;
}

export const redisStore = async () => createMemoryStore();
export const redisInsStore = async () => createMemoryStore();
export const redisClusterStore = async () => createMemoryStore();
export const redisClusterInsStore = async () => createMemoryStore();
export class NoCacheableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoCacheableError';
  }
}
export const avoidNoCacheable = async (p: Promise<any>) => p;
