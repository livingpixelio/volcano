import { createCacheAdapterMemory } from "./adapters/CacheAdaptorMemory.ts";
import { AttachmentManager } from "./attachment.ts";
import { FILE_TYPE, ATTACHMENT_TYPE, UNTYPED_TYPE } from "./constants.ts";
import { buildFullFileList, FileEntry, mkdir, openFile } from "./disk/deno.ts";
import { makeModel } from "./model.ts";
import {
  getChecksum,
  getFrontmatter,
  getPlainText,
  parseMd,
} from "./parsers/index.ts";

import type {
  FileMeta,
  Vault,
  OpenVaultOptions,
  Frontmatter,
} from "./types.ts";

/**
 * Opens an Obsidian vault for querying. Note that the contents of the vault
 * will be read at the time this function is called.
 */
export const openVault = async (options: OpenVaultOptions): Promise<Vault> => {
  const {
    path,
    cacheAdapter: store,
    attachmentCachePath,
  } = {
    cacheAdapter: createCacheAdapterMemory(),
    attachmentCachePath: null,
    ...options,
  };

  if (attachmentCachePath) {
    await mkdir(attachmentCachePath);
  }

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
        file: entry,
      });
      await store.set<{ meta: FileMeta; frontmatter: Frontmatter }>(
        noteType,
        noteSlug,
        {
          meta: {
            slug: noteSlug,
            type: noteType,
            checksum,
            title: entry.title,
            file: entry,
          },
          frontmatter,
        }
      );
    } else {
      await store.set<FileMeta>(FILE_TYPE, entry.defaultSlug, {
        slug: entry.defaultSlug,
        type: ATTACHMENT_TYPE,
        checksum,
        title: entry.title,
        file: entry,
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

  const all = () => {
    return store.listValues<FileMeta>(FILE_TYPE);
  };

  const getContent = async (slug: string) => {
    const files = await store.listValues<FileMeta>(FILE_TYPE);
    const file = files.find((item) => item.slug === slug);
    if (!file) return null;

    const data = await openFile(path, file.file);
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(data);
    const content = parseMd(text);
    return content;
  };

  const getText = async (slug: string) => {
    const content = await getContent(slug);
    if (!content) return null;
    return getPlainText(content);
  };

  const { attachment, cacheAttachments } = AttachmentManager(
    path,
    store,
    attachmentCachePath
  );

  return {
    all,
    createModel: makeModel(path, store),
    getContent,
    getText,
    attachment,
    cacheAttachments,
  };
};
