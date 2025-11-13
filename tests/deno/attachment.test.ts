import { openVault } from "@lps/volcano";
import * as path from "@std/path";
import { assert } from "@std/assert/assert";

Deno.test("get attachment", async () => {
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const data = await vault.attachment("forest1.jpg");
  assert(data?.byteLength);
});

const TMP_DIR = path.join(Deno.cwd(), "tmp");

Deno.test("creates attachment cache folder when specified", async () => {
  await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    attachmentCachePath: TMP_DIR,
  });

  Deno.readDir(TMP_DIR);

  await Deno.remove(TMP_DIR, { recursive: true });
});

Deno.test("writes variants to attachment cache", async () => {
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    attachmentCachePath: TMP_DIR,
  });

  const original = await vault.attachment("forest1.jpg");
  const small = await vault.attachment("forest1.jpg", 300);

  assert(original && small && small.byteLength < original.byteLength);

  await Deno.remove(TMP_DIR, { recursive: true });
});

Deno.test("pre-caches all attachments if requested", async () => {
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
    attachmentCachePath: TMP_DIR,
  });

  await vault.cacheAttachments([300]);

  const image = await Deno.readFile(path.join(TMP_DIR, "forest1_w300.jpg"));
  assert(image?.byteLength);

  await Deno.remove(TMP_DIR, { recursive: true });
});
