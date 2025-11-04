import { assert } from "@std/assert";
import { main } from "../../src/mod.ts";

Deno.test("tests the tests", () => {
  assert(main(), "apply");
});
