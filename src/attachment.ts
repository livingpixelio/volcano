import { Image } from "@cross/image";
import { ATTACHMENT_TYPE, FILE_TYPE } from "./constants.ts";
import { mkdir, openFile, readFileIfExists, writeBuffer } from "./disk/deno.ts";
import { CacheAdapter, FileMeta } from "./types.ts";

export const AttachmentManager = (
  path: string,
  store: CacheAdapter,
  attachmentCachePath: string | null
) => {
  const attachment = async (
    slug: string,
    width?: number
  ): Promise<Blob | null> => {
    const file = await store.get<FileMeta>(FILE_TYPE, slug);
    if (!file) return null;
    const original = await openFile(path, file.file);

    if (width) {
      const widthInt = Math.floor(width);
      const cached = await checkCache(attachmentCachePath, file, widthInt);
      if (cached) {
        return toBlob(cached, file);
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
      return toBlob(output, file);
    }

    return toBlob(original, file);
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
  const img = await Image.decode(bytes);
  const metadata = await Image.extractMetadata(bytes);
  const format = metadata?.format;
  if (!format) {
    return bytes;
  }

  const originalWidth = img.width;
  const aspect = img.height / img.width;

  if (width >= originalWidth) {
    return bytes;
  }
  const resized = await img
    .resize({ width: Math.floor(width), height: Math.floor(width * aspect) })
    .encode(format);
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

const toBlob = (bytes: Uint8Array, file: FileMeta) => {
  return new Blob([bytes as Uint8Array<ArrayBuffer>], {
    type: `image/${file.file.extension.slice(1)}`,
  });
};
