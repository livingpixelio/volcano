import { assert, assertEquals } from "@std/assert";
import * as path from "@std/path";
import { openVault } from "../../src/mod.ts";
import { createCacheAdapterMemory } from "../../src/adapters/CacheAdaptorMemory.ts";

Deno.test("open real vault", async () => {
  const result = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    log: "silent",
  })
    .then(() => 1)
    .catch(() => 0);
  return assertEquals(result, 1);
});

Deno.test("open a vault that does not exist", async () => {
  const result = await openVault({
    path: "/foo/bar",
    log: "silent",
  })
    .then(() => 1)
    .catch(() => 0);
  return assertEquals(result, 0);
});

Deno.test("openVault.all", async () => {
  const vault = await openVault({
    log: "silent",
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const files = await vault.all();
  assertEquals(files.length, 8);
});

Deno.test("supply the same cache and run it twice", async () => {
  const cache = createCacheAdapterMemory();
  await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    log: "silent",
    cacheAdapter: cache,
  });
  const init = await cache.listAll();

  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    log: "silent",
    cacheAdapter: cache,
  });
  const files = await vault.all();
  assertEquals(files.length, 8);

  const final = await cache.listAll();
  assertEquals(init.length, final.length);
});

Deno.test("return content when single note is requested", async () => {
  const vault = await openVault({
    log: "silent",
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const result = await vault.getText(
    "a-post-with-special-characters-in-the-title",
  );
  assertEquals(result, "The content");
});

Deno.test("find a search term in a title", async () => {
  const vault = await openVault({
    log: "silent",
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const results = await vault.search("post");

  assertEquals(results.length, 2);
  // order not guaranteed, but these two should be the two slugs retrieved:
  assert(
    [
      "a-custom-post-slug",
      "a-post-with-special-characters-in-the-title",
    ].includes(results[0].slug),
  );
});

Deno.test("find a search term with a limit", async () => {
  const vault = await openVault({
    log: "silent",
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const results = await vault.search("post", { limit: 1 });
  assertEquals(results.length, 1);
});

Deno.test("find a search term in the content", async () => {
  const vault = await openVault({
    log: "silent",
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const results = await vault.search("that links to");

  assertEquals(results.length, 1);
  assertEquals(results[0].slug, "a-custom-page");
  assertEquals(results[0].blocks, [2]);
});
