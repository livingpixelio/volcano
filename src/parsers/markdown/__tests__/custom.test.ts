import { assertEquals } from "@std/assert";
import type { MdastNode } from "../MdastNode.ts";
import { parseCustom, parseShortcodeAttr } from "../custom.ts";

Deno.test("parse XLinks", () => {
  const input =
    "This hobbit was a very [[Hobbits|well-to-do]] hobbit, and his name was Baggins.";
  const expected: MdastNode[] = [
    { type: "text", value: "This hobbit was a very " },
    {
      type: "xlink",
      filename: "Hobbits",
      children: [{ type: "text", value: "well-to-do" }],
    },
    { type: "text", value: " hobbit, and his name was Baggins." },
  ];

  assertEquals(parseCustom(input), expected);
});

Deno.test("parse XLinks: implicit child text", () => {
  const input =
    "This hobbit was a very [[well-to-do]] hobbit, and his name was Baggins.";
  const expected: MdastNode[] = [
    { type: "text", value: "This hobbit was a very " },
    {
      type: "xlink",
      filename: "well-to-do",
      children: [{ type: "text", value: "well-to-do" }],
    },
    { type: "text", value: " hobbit, and his name was Baggins." },
  ];

  assertEquals(parseCustom(input), expected);
});

Deno.test("parse Attachments", () => {
  const input =
    "This hobbit was a very well-to-do hobbit, ![[bilbo.png|Bilbo Baggins in his hole]] and his name was Baggins.";
  const expected: MdastNode[] = [
    { type: "text", value: "This hobbit was a very well-to-do hobbit, " },
    {
      type: "attachment",
      filename: "bilbo",
      extension: ".png",
      alt: "Bilbo Baggins in his hole",
    },
    { type: "text", value: " and his name was Baggins." },
  ];

  assertEquals(parseCustom(input), expected);
});

Deno.test("parse Attachments", () => {
  const input =
    'This hobbit was a very well-to-do hobbit[Ref pageNum="1"], and his name was Baggins.';
  const expected: MdastNode[] = [
    { type: "text", value: "This hobbit was a very well-to-do hobbit" },
    {
      type: "shortcode",
      name: "Ref",
      pageNum: "1",
    },
    { type: "text", value: ", and his name was Baggins." },
  ];

  assertEquals(parseCustom(input), expected);
});

Deno.test("should combine all custom parsers", () => {
  const input =
    'This hobbit was a very [[Hobbits|well-to-do]] hobbit[Ref pageNum="1"], ![[bilbo.png|Bilbo Baggins in his hole]] and his name was Baggins.';
  const expected: MdastNode[] = [
    { type: "text", value: "This hobbit was a very " },
    {
      type: "xlink",
      filename: "Hobbits",
      children: [{ type: "text", value: "well-to-do" }],
    },
    { type: "text", value: " hobbit" },
    {
      type: "shortcode",
      name: "Ref",
      pageNum: "1",
    },
    { type: "text", value: ", " },
    {
      type: "attachment",
      filename: "bilbo",
      extension: ".png",
      alt: "Bilbo Baggins in his hole",
    },
    { type: "text", value: " and his name was Baggins." },
  ];

  assertEquals(parseCustom(input), expected);
});

Deno.test("shortcode parser", () => {
  const input = 'pageNum="1"';
  const expected = { pageNum: "1" };
  assertEquals(parseShortcodeAttr(input), expected);
});

Deno.test("shortcode parser: no input", () => {
  const input = "";
  assertEquals(parseShortcodeAttr(input), {});
});

Deno.test("shortcode parser: undefined", () => {
  assertEquals(parseShortcodeAttr(), {});
});

Deno.test("multiple attr with quotes", () => {
  const input = 'fullName="Bilbo Baggins" pageNum="1"';
  const expected = {
    fullName: "Bilbo Baggins",
    pageNum: "1",
  };
  assertEquals(parseShortcodeAttr(input), expected);
});

Deno.test("multiple attributes with no quotes", () => {
  const input = 'firstName=Bilbo lastName=Baggins pageNum="1"';
  const expected = {
    firstName: "Bilbo",
    lastName: "Baggins",
    pageNum: "1",
  };
  assertEquals(parseShortcodeAttr(input), expected);
});
