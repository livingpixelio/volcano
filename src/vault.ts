import { createCacheAdapterMemory } from "./adapters/CacheAdaptorMemory.ts";
import { buildFullFileList, FileEntry, openFile } from "./disk/deno.ts";
import { makeModel } from "./model.ts";
import { getChecksum, getFrontmatter, parseMd } from "./parsers/index.ts";

import type { FileMeta, Vault, OpenVaultOptions } from "./types.ts";

const FILE_TYPE = "_files";
const ATTACHMENT_TYPE = "_attachments";
const UNTYPED_TYPE = "_untyped";

/**
 * Opens an Obsidian vault for querying. Note that the contents of the vault
 * will be read at the time this function is called.
 */
export const openVault = async (options: OpenVaultOptions): Promise<Vault> => {
  const { path, cacheAdapter: store } = {
    cacheAdapter: createCacheAdapterMemory(),
    ...options,
  };

  let fileList: FileEntry[];
  try {
    fileList = await buildFullFileList(path);
  } catch (_err) {
    throw new Error("CannotReadVault");
  }

  const keysToRemove = new Set(await store.list(FILE_TYPE));
  for (const entry of fileList) {
    keysToRemove.delete(entry.defaultSlug);
    const data = await openFile(path, entry);
    const checksum = await getChecksum(data);
    const existing = await store.get<FileMeta>(FILE_TYPE, entry.defaultSlug);

    // no change
    if (existing && existing.checksum === checksum) {
      continue;
    }

    if (entry.extension === ".md") {
      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(data);
      // @TODO: avoid full parse on the initial run
      const content = parseMd(text);
      const frontmatter = getFrontmatter(content);
      const noteType = frontmatter["type"] || UNTYPED_TYPE;
      const noteSlug = frontmatter["slug"] || entry.defaultSlug;
      await store.set<FileMeta>(FILE_TYPE, entry.defaultSlug, {
        slug: noteSlug,
        type: noteType,
        checksum,
        title: entry.title,
      });
      await store.set(noteType, noteSlug, {
        meta: {
          slug: noteSlug,
          type: noteType,
          checksum,
          title: entry.title,
        },
        frontmatter,
      });
    } else {
      await store.set<FileMeta>(FILE_TYPE, entry.defaultSlug, {
        slug: entry.defaultSlug,
        type: ATTACHMENT_TYPE,
        checksum,
        title: entry.title,
      });
    }
  }
  for (const keyToRemove of Array.from(keysToRemove)) {
    const fileMeta = await store.get<FileMeta>(FILE_TYPE, keyToRemove);
    if (fileMeta) {
      await store.delete(fileMeta.type, fileMeta.slug);
    }
    await store.delete(FILE_TYPE, keyToRemove);
  }

  return {
    all: () => {
      return store.listValues<FileMeta>(FILE_TYPE);
    },
    createModel: makeModel(store),
  };
};
