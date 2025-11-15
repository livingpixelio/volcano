import { assertEquals, assertFalse } from "@std/assert";
import * as path from "@std/path";
import { openVault } from "../../src/mod.ts";
import { selectNodes } from "../../src/parsers/index.ts";
import { flattenTree } from "../../src/parsers/markdown/metadata.ts";
import { XLink } from "../../src/parsers/markdown/MdastNode.ts";

Deno.test("transforms internal links into URLs", async () => {
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    transformers: () => [],
  });
  const content = await vault.getContent("a-custom-page");
  if (!content) {
    throw new Error("content not found");
  }
  const xlinks = selectNodes(flattenTree(content))<XLink>("xlink");
  assertFalse(xlinks[0].file?.slug);

  const vaultWithTransform = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const contentTransformed = await vaultWithTransform.getContent(
    "a-custom-page"
  );
  if (!contentTransformed) {
    throw new Error("content not found");
  }
  const xlinksTransformed = selectNodes(flattenTree(contentTransformed))<XLink>(
    "xlink"
  );
  assertEquals(
    xlinksTransformed[0].file?.slug,
    "a-folder/a-page-inside-a-folder"
  );
});
