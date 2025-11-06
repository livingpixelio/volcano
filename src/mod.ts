import { createCacheAdapterMemory } from "./adapters/CacheAdaptorMemory.ts";
import { buildFullFileList, FileEntry, openFile } from "./disk/deno.ts";
import { getChecksum } from "./parsers/index.ts";

export type { MdastNodeTy } from "./parsers/index.ts";
export type { Root as MdastRootTy } from "./parsers/markdown/MdastNode.ts";

export interface FileMeta {
  slug: string;
  type?: string;
  checksum: string;
}

export interface Vault {
  all: () => FileMeta[];
}

export interface CacheAdapter {
  listAll: () => Promise<Array<[string, string]>>;
  list: (type: string) => Promise<string[]>;
  get: <ModelTy>(type: string, key: string) => Promise<ModelTy>;
  set: <ModelTy>(type: string, key: string, value: ModelTy) => Promise<void>;
  deleteAll: (type: string) => Promise<void>;
  delete: (type: string, key: string) => Promise<void>;
  purge: () => Promise<void>;
}

export interface OpenVaultOptions {
  /*
   * Absolute path of Obsidian vault.
   */
  path: string;
  cacheAdapter?: CacheAdapter;
}

/**
 * Opens an Obsidian vault for querying. Note that the contents of the vault
 * will be read at the time this function is called.
 */
export const openVault = async ({
  path,
  cacheAdapter,
}: OpenVaultOptions): Promise<Vault> => {
  let fileList: FileEntry[];
  try {
    fileList = await buildFullFileList(path);
  } catch (_err) {
    throw new Error("CannotReadVault");
  }

  const store = cacheAdapter || createCacheAdapterMemory();
  const keysToRemove = await store.listAll();
  for (const entry of fileList) {
    const data = await openFile(path, entry);
    const checksum = await getChecksum(data);
  }

  // create two lookup tables: one maps type-slugs (use * as sentinel for no type) to:
  // - FileMeta, frontmatter, and content (if processed)
  // For attachments: FileMeta + list of cached variants.
  // - the other maps XRefs to slugs (an XRef is the basename + ext for
  // attachments and basename only notes)
  //
  // Store both in KV if storage key is specified, or in memory (as Record) if not
  //
  // Remember to remove if not in filelist
};
