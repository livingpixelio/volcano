import * as path from "@std/path";
import { slugifyAsPath } from "../parsers/index.ts";

const IGNORE_DIR = ["templates", ".obsidian"];

export interface FileEntry {
  path: string;
  basename: string;
  extension: string;
  title: string;
  defaultSlug: string;
}

export const buildFullFileList = (
  rootDirPath: string
): Promise<FileEntry[]> => {
  const ignorePaths = IGNORE_DIR.map((name) => path.join(rootDirPath, name));

  const buildListForDir = async (dirPath: string): Promise<FileEntry[]> => {
    const dir = Deno.readDir(dirPath);

    let entries: FileEntry[] = [];

    const context = dirPath.replace(rootDirPath, "").slice(1);

    for await (const dirEntry of dir) {
      if (dirEntry.isFile) {
        const extension = path.extname(dirEntry.name);
        const basename = path.basename(dirEntry.name, extension);
        const slugBase = slugifyAsPath(path.join(context, basename));
        const fileEntry = {
          path: context,
          basename,
          extension,
          defaultSlug:
            extension === ".md" ? slugBase : `${slugBase}${extension}`,
          title: extension === ".md" ? basename : `${basename}${extension}`,
        };
        entries = [...entries, fileEntry];
      } else if (
        dirEntry.isDirectory &&
        !ignorePaths.includes(path.join(dirPath, dirEntry.name))
      ) {
        const result = await buildListForDir(path.join(dirPath, dirEntry.name));
        entries = [...entries, ...result];
      }
    }

    return entries;
  };

  return buildListForDir(rootDirPath);
};

export const openFile = (rootDirPath: string, fileEntry: FileEntry) =>
  Deno.readFile(
    path.join(
      rootDirPath,
      fileEntry.path,
      `${fileEntry.basename}${fileEntry.extension}`
    )
  );

export const mkdir = async (path: string, removeFirst?: boolean) => {
  if (removeFirst) {
    await Deno.remove(path, { recursive: true });
  }

  // Deno.mkdir throws if the directory already exists, but that's fine in this
  // case, so just catch the error and ignore it
  return Deno.mkdir(path, { recursive: true }).catch();
};

export const readFileIfExists = (
  rootDirPath: string,
  filename: string
): Promise<Uint8Array | null> => {
  return Deno.readFile(path.join(rootDirPath, filename)).catch(() => null);
};

export const writeBuffer = async (
  rootDirPath: string,
  filename: string,
  data: Uint8Array<ArrayBuffer>
) => {
  const parts = filename.split("/");
  if (parts.length > 1) {
    const fullPath = path.join(rootDirPath, ...parts.slice(0, -1));
    await mkdir(fullPath);
  }

  return Deno.writeFile(path.join(rootDirPath, filename), data);
};
