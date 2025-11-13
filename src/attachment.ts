import { ATTACHMENT_TYPE, FILE_TYPE } from "./constants.ts";
import { mkdir, openFile, readFileIfExists, writeBuffer } from "./disk/deno.ts";
import { CacheAdapter, FileMeta } from "./types.ts";
import sharp from "sharp";

export const AttachmentManager = (
  path: string,
  store: CacheAdapter,
  attachmentCachePath: string | null
) => {
  const attachment = async (slug: string, width?: number) => {
    const file = await store.get<FileMeta>(FILE_TYPE, slug);
    if (!file) return null;
    const original = await openFile(path, file.file);

    if (width) {
      const widthInt = Math.floor(width);
      const cached = await checkCache(attachmentCachePath, file, widthInt);
      if (cached) {
        return cached;
      }

      const output = await processImage(original, widthInt).catch(() => {
        throw new Error(`ProcessingError: ${slug}`);
      });

      if (attachmentCachePath) {
        writeBuffer(
          attachmentCachePath,
          createCacheFilename(file, widthInt),
          output
        );
      }
      return output;
    }

    return original;
  };

  const cacheAttachments = async (widths: number[]) => {
    if (!attachmentCachePath) throw new Error("NoAttachmentCacheProvided");
    await mkdir(attachmentCachePath, true);
    const files = await store.listValues<FileMeta>(FILE_TYPE);

    for (const file of files) {
      if (file.type !== ATTACHMENT_TYPE) continue;

      for (const width of widths) {
        await attachment(file.slug, width);
      }
    }
  };

  return {
    attachment,
    cacheAttachments,
  };
};

const processImage = async (
  bytes: Uint8Array<ArrayBuffer>,
  width: number
): Promise<Uint8Array<ArrayBuffer>> => {
  const img = sharp(bytes);
  const { width: originalWidth } = await img.metadata();
  if (width >= originalWidth) {
    return bytes;
  }
  const resized = await img.resize(width).toBuffer();
  return new Uint8Array(resized);
};

const createCacheFilename = (file: FileMeta, width: number) => {
  const slugBase = file.slug.split(".")[0];
  return `${slugBase}_w${width}${file.file.extension}`;
};

const checkCache = (
  cachePath: string | null,
  file: FileMeta,
  width: number
) => {
  if (!cachePath) return null;
  return readFileIfExists(cachePath, createCacheFilename(file, width));
};
