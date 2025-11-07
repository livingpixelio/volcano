import * as z from "@zod/zod";

export interface FileMeta {
  slug: string;
  title: string;
  type: string;
  checksum: string;
}

// frontmatter will always be a record, but we don't know much beyond that
// deno-lint-ignore no-explicit-any
export type Frontmatter = Record<string, any>;

export interface Model<FrontmatterTy extends Frontmatter> {
  all: () => Promise<
    Array<{
      title: string;
      slug: string;
      frontmatter: FrontmatterTy;
    }>
  >;
  get: (slug: string) => Promise<{
    title: string;
    slug: string;
    frontmatter: FrontmatterTy;
  } | null>;
}

export interface Vault {
  all: () => Promise<FileMeta[]>;
  createModel: <FrontmatterTy extends Frontmatter>(
    type: string,
    schema: z.ZodObject<Record<string, z.Schema>>
  ) => Model<FrontmatterTy>;
}

export interface CacheAdapter {
  listAll: () => Promise<Array<[string, string]>>;
  list: (type: string) => Promise<string[]>;
  listValues: <ModelTy>(type: string) => Promise<ModelTy[]>;
  get: <ModelTy>(type: string, key: string) => Promise<ModelTy | null>;
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
