import { assertEquals } from "@std/assert";
import * as path from "@std/path";
import { openVault } from "../../src/mod.ts";
import { createCacheAdapterMemory } from "../../src/adapters/CacheAdaptorMemory.ts";

Deno.test("tests the tests", () => {
  const result = [0, 1, 2].indexOf(3);
  assertEquals(result, -1);
});

Deno.test("open real vault", async () => {
  const result = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  })
    .then(() => 1)
    .catch(() => 0);
  return assertEquals(result, 1);
});

Deno.test("open a vault that does not exist", async () => {
  const result = await openVault({
    path: "/foo/bar",
  })
    .then(() => 1)
    .catch(() => 0);
  return assertEquals(result, 0);
});

Deno.test("openVault.all", async () => {
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const files = await vault.all();
  assertEquals(files.length, 7);
});

Deno.test("supply the same cache and run it twice", async () => {
  const cache = createCacheAdapterMemory();
  await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    cacheAdapter: cache,
  });
  const init = await cache.listAll();

  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    cacheAdapter: cache,
  });
  const files = await vault.all();
  assertEquals(files.length, 7);

  const final = await cache.listAll();
  assertEquals(init.length, final.length);
});

Deno.test("return content when single note is requested", async () => {
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const result = await vault.getText(
    "a-post-with-special-characters-in-the-title"
  );
  assertEquals(result, "The content");
});
