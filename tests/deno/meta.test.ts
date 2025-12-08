import { assertEquals } from "@std/assert";

Deno.test("tests the tests", () => {
  const result = [0, 1, 2].indexOf(3);
  assertEquals(result, -1);
});
