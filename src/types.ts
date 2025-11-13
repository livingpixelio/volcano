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
    schema: z.ZodObject<Record<string, z.Schema>>
  ) => Model<FrontmatterTy>;

  getContent: (slug: string) => Promise<Root | null>;

  getText: (slug: string) => Promise<string | null>;

  attachment: (slug: string, width?: number) => Promise<Uint8Array | null>;

  cacheAttachments: (widths: number[]) => Promise<void>;

  /**
   * Get original file contents
  getMd: (slug: string) => Promise<string>;
  * Get contents as HTML
  getHtml: (slug: string) => Promise<string>;

  precacheAttachments

  search
  */
}

export interface OpenVaultOptions {
  /*
   * Absolute path of Obsidian vault.
   */
  path: string;
  cacheAdapter?: CacheAdapter;
  attachmentCachePath?: string | null;
}

export interface FileMeta {
  slug: string;
  title: string;
  type: string;
  checksum: string;
  file: FileEntry;
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

  search
  */
}

// frontmatter will always be a record, but we don't know much beyond that
// deno-lint-ignore no-explicit-any
export type Frontmatter = Record<string, any>;

/**
 * CONTENT
 */

export type { MdastNodeTy } from "./parsers/index.ts";
export type { Root as MdastRootTy } from "./parsers/markdown/MdastNode.ts";

export type Transformer = (node: MdastNodeTy.MdastNode) => {
  key: string;
  transform: (
    getDataFromTitle: (title: string) => FileMeta
  ) => Promise<MdastNodeTy.MdastNode>;
};

/**
 * ATTACHMENTS
 */

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
