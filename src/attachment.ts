import { FILE_TYPE } from "./constants.ts";
import { openFile, writeBuffer } from "./disk/deno.ts";
import { CacheAdapter, FileMeta, GetAttachmentOptions } from "./types.ts";
import sharp from "sharp";

export const AttachmentManager = (
  path: string,
  store: CacheAdapter,
  attachmentCachePath: string | null
) => {
  const attachment = async (slug: string, options?: GetAttachmentOptions) => {
    const file = await store.get<FileMeta>(FILE_TYPE, slug);
    if (!file) return null;
    const original = await openFile(path, file.file);

    if (options?.width) {
      const resized = await sharp(original).resize(options.width).toBuffer();
      const asArray = new Uint8Array(resized);
      if (attachmentCachePath) {
        writeBuffer(attachmentCachePath, file.file.defaultSlug, asArray);
      }
      return new Uint8Array(resized);
    }
    return original;
  };

  const cacheAttachments = async (options: GetAttachmentOptions[]) => {};

  return {
    attachment,
    cacheAttachments,
  };
};
