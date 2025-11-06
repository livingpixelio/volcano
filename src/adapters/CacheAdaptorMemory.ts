import { CacheAdapter } from "../mod.ts";

class CacheAdapterMemory implements CacheAdapter {
  // deno-lint-ignore no-explicit-any
  private cache: Record<string, any>;

  constructor() {
    this.cache = {};
  }

  public listAll(): Promise<Array<[string, string]>> {
    const keys: Array<[string, string]> = Object.keys(this.cache).reduce(
      (acc, cacheKey) => {
        const [type, key] = cacheKey.split(":");
        return [...acc, [type, key]];
      },
      [] as Array<[string, string]>
    );
    return Promise.resolve(keys);
  }

  public async list(type: string): Promise<string[]> {
    const allKeys = await this.listAll();
    return allKeys.filter((key) => key[0] === type).map((key) => key[1]);
  }

  public get<Ty>(type: string, key: string): Promise<Ty | null> {
    const result: Ty = this.cache[`${type}:${key}`];
    if (typeof result !== "undefined") {
      return Promise.resolve(result);
    } else {
      return Promise.resolve(null);
    }
  }

  public set<Ty>(type: string, key: string, value: Ty): Promise<void> {
    this.cache[`${type}:${key}`] = value;
    return Promise.resolve();
  }

  public deleteAll(type: string) {
    this.cache = Object.keys(this.cache).reduce((acc, cacheKey) => {
      const [itemType] = cacheKey.split(":");
      if (itemType === type) {
        return acc;
      } else {
        acc[cacheKey] = this.cache[cacheKey];
        return acc;
      }
    }, {} as typeof this.cache);
    return Promise.resolve();
  }

  public delete(type: string, key: string) {
    const toDelete = `${type}:${key}`;
    this.cache = Object.keys(this.cache).reduce((acc, cacheKey) => {
      if (cacheKey === toDelete) {
        return acc;
      } else {
        acc[cacheKey] = this.cache[cacheKey];
        return acc;
      }
    }, {} as typeof this.cache);
    return Promise.resolve();
  }

  public purge() {
    this.cache = {};
    return Promise.resolve();
  }
}

export const createCacheAdapterMemory = () => new CacheAdapterMemory();
