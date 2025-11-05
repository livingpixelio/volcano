import { assertEquals } from "@std/assert";

import { slugFromFilename, slugify } from "../slugify.ts";

Deno.test("slugify", () => {
  assertEquals(slugify("my_awesome post"), "my-awesome-post");
});

Deno.test("slufigy and remove special characters", () => {
  assertEquals(
    slugify("Isn't this an awesome post?"),
    "isnt-this-an-awesome-post"
  );
});

Deno.test("slugFromFilename", () => {
  assertEquals(slugFromFilename("My Awesome Post.md"), "my-awesome-post");
});
