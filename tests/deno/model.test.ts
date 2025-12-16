import z from "@zod/zod";
import { openVault } from "@lps/volcano";
import * as path from "@std/path";
import { assertEquals } from "@std/assert/equals";

Deno.test("get all notes matching schema", async () => {
  const schema = z.object({
    date_published: z.date().nullable().optional(),
  });
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const post = vault.createModel("Post", schema);
  const results = await post.all();
  assertEquals(results.length, 2);
});

Deno.test("ignore frontmatter not passed to the schema", async () => {
  const schema = z.object({
    date_published: z.date().nullable().optional(),
  });
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const post = vault.createModel("Post", schema);
  const results = await post.all();
  const bannerImages = results.filter(
    (result) =>
      (result.frontmatter as { date_published: Date; banner_image: string })
        .banner_image
  );
  assertEquals(bannerImages.length, 0);
});

Deno.test("throw when schemas do not match", async () => {
  const schema = z.object({
    foo: z.string(),
  });
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const post = vault.createModel("Post", schema);
  const result = await post
    .all()
    .then(() => 1)
    .catch(() => 0);
  assertEquals(result, 0);
});

Deno.test("return content when single note is requested", async () => {
  const schema = z.object({
    date_published: z.date().nullable().optional(),
  });
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const post = vault.createModel("Post", schema);
  const result = await post.getText(
    "a-post-with-special-characters-in-the-title"
  );
  assertEquals(result, "The content");
});

Deno.test("find a search term in the content", async () => {
  const schema = z.object({
    date_published: z.date().nullable().optional(),
  });
  const vault = await openVault({
    path: path.join(Deno.cwd(), "tests/data/blog"),
  });
  const post = vault.createModel("Post", schema);
  const results = await post.search("paragraph");

  assertEquals(results.length, 1);
  assertEquals(results[0].blocks, [3]);
});
