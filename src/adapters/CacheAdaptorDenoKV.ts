import { DENO_KV_ADAPTER_DEFAULT_PREFIX } from "../constants.ts";
import { CacheAdapter } from "../types.ts";

class CacheAdapterDenoKV implements CacheAdapter {
  private db: Deno.Kv;
  private prefix: string;

  constructor(db: Deno.Kv, prefix?: string) {
    this.db = db;
    this.prefix = prefix || DENO_KV_ADAPTER_DEFAULT_PREFIX;
  }

  public async listAll(): Promise<Array<[string, string]>> {
    let keys: Array<[string, string]> = [];
    const entries = this.db.list({ prefix: [this.prefix] });
    for await (const entry of entries) {
      const type = entry.key[1] as string;
      const key = entry.key[2] as string;
      keys = [...keys, [type, key]];
    }
    return Promise.resolve(keys);
  }

  public async list(type: string): Promise<string[]> {
    let keys: string[] = [];
    const entries = this.db.list({ prefix: [this.prefix, type] });
    for await (const entry of entries) {
      const key = entry.key[2] as string;
      keys = [...keys, key];
    }
    return Promise.resolve(keys);
  }

  public async listValues<Ty>(type: string): Promise<Ty[]> {
    let values: Ty[] = [];
    const entries = this.db.list({ prefix: [this.prefix, type] });
    for await (const entry of entries) {
      const value = entry.value as Ty;
      values = [...values, value];
    }
    return Promise.resolve(values);
  }

  public async get<Ty>(type: string, key: string): Promise<Ty | null> {
    const entry = await this.db.get<Ty>([this.prefix, type, key]);
    return entry?.value || null;
  }

  public async set<Ty>(type: string, key: string, value: Ty): Promise<void> {
    await this.db.set([this.prefix, type, key], value);
    return Promise.resolve();
  }

  public async deleteAll(type: string): Promise<void> {
    const entries = this.db.list({ prefix: [this.prefix, type] });
    for await (const entry of entries) {
      await this.db.delete(entry.key);
    }
    return Promise.resolve();
  }

  public async delete(type: string, key: string): Promise<void> {
    await this.db.delete([this.prefix, type, key]);
    return Promise.resolve();
  }

  public async purge(): Promise<void> {
    const entries = this.db.list({ prefix: [this.prefix] });
    for await (const entry of entries) {
      await this.db.delete(entry.key);
    }
    return Promise.resolve();
  }
}

export const createCacheAdapterDenoKV = (
  db: Deno.Kv,
  prefix?: string
): CacheAdapter => new CacheAdapterDenoKV(db, prefix);
