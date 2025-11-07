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
  const post = vault.createModel<z.infer<typeof schema>>("Post", schema);
  const results = await post.all();
  results[0].frontmatter.date_published;
  assertEquals(results.length, 2);
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
  const result = await post.get("a-custom-post-slug");
  assertEquals(result?.title, "A post");
});
