import { assertEquals } from "@std/assert";
import * as path from "@std/path";
import { parseMd } from "../parseMd.ts";
import { flattenTree, getFrontmatter } from "../metadata.ts";
import { Attachment, Shortcode, XLink } from "../MdastNode.ts";
import { selectNodes } from "../index.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const text = await Deno.readTextFile(path.join(__dirname, "testpost.md"));

Deno.test("parser does not throw on valid markdown", () => {
  const result = parseMd(text);
  assertEquals(result.type, "root");
});

Deno.test("gets the metadata", () => {
  const mdast = parseMd(text);
  const metadata = getFrontmatter(mdast);
  assertEquals(metadata.summary, "On my awesome site");
});

Deno.test("finds custom elements", () => {
  const selector = selectNodes(flattenTree(parseMd(text)));

  const xlink = selector<XLink>("xlink");
  assertEquals(xlink.length, 1);

  const attachment = selector<Attachment>("attachment");
  assertEquals(attachment.length, 1);

  const shortcode = selector<Shortcode>("shortcode");
  assertEquals(shortcode.length, 1);
});
