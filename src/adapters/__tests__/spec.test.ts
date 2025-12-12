import { assertEquals } from "@std/assert";
import { createCacheAdapterMemory } from "../CacheAdaptorMemory.ts";
import { createCacheAdapterDenoKV } from "../CacheAdaptorDenoKV.ts";

const ADAPTERS = {
  memory: createCacheAdapterMemory(),
  denoKv: createCacheAdapterDenoKV(await Deno.openKv(":memory:")),
};

Object.entries(ADAPTERS).forEach(([key, adapter]) => {
  Deno.test(`Adapters: ${key}: initial list empty`, async () => {
    await adapter.purge();
    const result = await adapter.listAll();
    assertEquals(result.length, 0);
  });

  Deno.test(`Adapters: ${key}: set and get single item`, async () => {
    await adapter.purge();
    await adapter.set("user", "john", { name: "John Doe", age: 30 });
    const result = await adapter.get("user", "john");
    assertEquals(result, { name: "John Doe", age: 30 });
  });

  Deno.test(`Adapters: ${key}: set and get string value`, async () => {
    await adapter.purge();
    await adapter.set("string", "key1", "test-value");
    const result = await adapter.get("string", "key1");
    assertEquals(result, "test-value");
  });

  Deno.test(`Adapters: ${key}: get non-existent key returns null`, async () => {
    await adapter.purge();
    const result = await adapter.get("user", "nonexistent");
    assertEquals(result, null);
  });

  Deno.test(
    `Adapters: ${key}: list all items with multiple types`,
    async () => {
      await adapter.purge();
      await adapter.set("post", "post1", { title: "Hello" });
      await adapter.set("post", "post2", { title: "World" });
      await adapter.set("user", "alice", { name: "Alice" });

      const result = await adapter.listAll();
      assertEquals(result.length, 3);
      assertEquals(
        result.some(([type, k]) => type === "post" && k === "post1"),
        true
      );
      assertEquals(
        result.some(([type, k]) => type === "post" && k === "post2"),
        true
      );
      assertEquals(
        result.some(([type, k]) => type === "user" && k === "alice"),
        true
      );
    }
  );

  Deno.test(`Adapters: ${key}: list filters by type`, async () => {
    await adapter.purge();
    await adapter.set("comment", "c1", { text: "Great!" });
    await adapter.set("comment", "c2", { text: "Nice!" });
    await adapter.set("tag", "t1", { name: "javascript" });

    const comments = await adapter.list("comment");
    assertEquals(comments.length, 2);
    assertEquals(comments.includes("c1"), true);
    assertEquals(comments.includes("c2"), true);
  });

  Deno.test(
    `Adapters: ${key}: listValues returns all values of a type`,
    async () => {
      await adapter.purge();
      await adapter.set("product", "p1", { id: 1, name: "Apple" });
      await adapter.set("product", "p2", { id: 2, name: "Banana" });

      const values = await adapter.listValues("product");
      assertEquals(values.length, 2);
      assertEquals(
        values.some((v) => (v as Record<string, unknown>).name === "Apple"),
        true
      );
      assertEquals(
        values.some((v) => (v as Record<string, unknown>).name === "Banana"),
        true
      );
    }
  );

  Deno.test(`Adapters: ${key}: delete removes specific item`, async () => {
    await adapter.purge();
    await adapter.set("item", "x1", { value: "keep" });
    await adapter.set("item", "x2", { value: "delete" });
    await adapter.delete("item", "x2");

    const result = await adapter.get("item", "x2");
    assertEquals(result, null);
    const kept = await adapter.get("item", "x1");
    assertEquals(kept, { value: "keep" });
  });

  Deno.test(
    `Adapters: ${key}: deleteAll removes all items of a type`,
    async () => {
      await adapter.purge();
      await adapter.set("temp", "t1", { data: "temp1" });
      await adapter.set("temp", "t2", { data: "temp2" });
      await adapter.set("permanent", "p1", { data: "keep" });

      await adapter.deleteAll("temp");

      const temps = await adapter.list("temp");
      assertEquals(temps.length, 0);
      const permanent = await adapter.get("permanent", "p1");
      assertEquals(permanent, { data: "keep" });
    }
  );

  Deno.test(`Adapters: ${key}: purge clears entire cache`, async () => {
    await adapter.purge();
    await adapter.set("a", "1", { val: 1 });
    await adapter.set("b", "2", { val: 2 });

    await adapter.purge();

    const result = await adapter.listAll();
    assertEquals(result.length, 0);
  });
});
