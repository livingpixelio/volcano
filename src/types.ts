import * as z from "@zod/zod";
import { Root } from "./parsers/markdown/MdastNode.ts";
import { FileEntry } from "./disk/deno.ts";
import { MdastNodeTy } from "./parsers/index.ts";

/**
 * VAULTS
 */

export interface Vault {
  all: () => Promise<FileMeta[]>;

  createModel: <FrontmatterTy extends Frontmatter>(
    type: string,
    schema: z.ZodType<FrontmatterTy>
  ) => Model<FrontmatterTy>;

  getContent: (slug: string) => Promise<Root | null>;

  getText: (slug: string) => Promise<string | null>;

  attachment: (slug: string, width?: number) => Promise<Blob | null>;

  cacheAttachments: (widths: number[]) => Promise<void>;

  /**
   * Get original file contents
  getMd: (slug: string) => Promise<string>;
  * Get contents as HTML
  getHtml: (slug: string) => Promise<string>;
  */

  search: (query: string, options?: SearchOptions) => Promise<SearchHit[]>;
}

export interface OpenVaultOptions {
  /*
   * Absolute path of Obsidian vault.
   */
  path: string;
  cacheAdapter?: CacheAdapter;
  attachmentCachePath?: string | null;
  transformers?: (defaultTransformers: Transformer[]) => Transformer[];
}

export interface SearchOptions {
  limit?: number;
}

export interface FileMeta {
  slug: string;
  title: string;
  type: string;
  checksum: string;
  file: FileEntry;
}

export interface SearchHit {
  slug: string;
  title: string;
  type: string;
  blocks?: number[];
}

/**
 * MODELS
 */

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

  getContent: (slug: string) => Promise<Root | null>;

  getText: (slug: string) => Promise<string | null>;

  /**
  * Get original file contents
  getMd: (slug: string) => Promise<string>;
  * Get contents as HTML
  getHtml: (slug: string) => Promise<string>;

  getAttachment
  */

  search: (query: string, options?: SearchOptions) => Promise<SearchHit[]>;
}

// frontmatter will always be a record, but we don't know much beyond that
export type Frontmatter = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

/**
 * CONTENT
 */

export type { MdastNodeTy } from "./parsers/index.ts";
export type { Root as MdastRootTy } from "./parsers/markdown/MdastNode.ts";

export type Transformer = (node: MdastNodeTy.MdastNode) =>
  | {
      key: string;
      transform: (
        getDataFromTitle: (title: string) => Promise<FileMeta | null>
      ) => Promise<MdastNodeTy.MdastNode> | MdastNodeTy.MdastNode;
    }
  | false;

/**
 * CACHE ADAPTER
 */

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
