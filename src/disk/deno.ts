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
