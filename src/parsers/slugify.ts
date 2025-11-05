import * as path from "@std/path";
import _slugify from "slugify";

export const slugify = (input: string) =>
  _slugify(input, {
    preserveCharacters: ["/"],
    lowercase: true,
  });

export const slugifyAsPath = (input: string) =>
  input
    .split("/")
    .map((part) => slugify(part))
    .join("/");

export const slugFromFilename = (filePath: string) => {
  const filename = path.basename(filePath, path.extname(filePath));
  return slugify(filename);
};
