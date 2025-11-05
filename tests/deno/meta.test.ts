import { assertEquals } from "@std/assert";
import * as path from "@std/path";
import { openVault } from "../../src/mod.ts";

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
