import * as path from "@std/path";
import { buildFullFileList } from "./deno.ts";
import { assert } from "@std/assert/assert";

Deno.test("generate full file list", async () => {
  const result = await buildFullFileList(
    path.join(Deno.cwd(), "tests/data/blog")
  );

  [
    "a-post-with-special-characters-in-the-title",
    "a-post",
    "a-page",
    "forest1.jpg",
    "scerevisiae.jpg",
    "a-folder/an-untyped-note-inside-a-folder",
    "a-folder/a-page-inside-a-folder",
  ].forEach((expected) => {
    const observed = result.find((entry) => entry.defaultSlug === expected);
    assert(observed);
  });
});
