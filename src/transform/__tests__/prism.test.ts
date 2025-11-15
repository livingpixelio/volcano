import { assert } from "@std/assert/assert";
import { parseMd, selectNodes } from "../../parsers/index.ts";
import { transformCode } from "../builtins.ts";
import { runner } from "../index.ts";
import { createCacheAdapterMemory } from "@lps/volcano";
import { assertEquals } from "@std/assert/equals";
import { flattenTree } from "../../parsers/markdown/metadata.ts";
import { Code } from "../../parsers/markdown/MdastNode.ts";

const code = `
\`\`\`jsx
<p className="m-0">This is JSX bro</p> 
\`\`\`
`;

const html = `<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>p</span> <span class="token attr-name">className</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>m-0<span class="token punctuation">"</span></span><span class="token punctuation">></span></span><span class="token plain-text">This is JSX bro</span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>p</span><span class="token punctuation">></span></span> `;

Deno.test("Check that Prism loaded languages are working", async () => {
  const md = parseMd(code);

  const afterTransform = await runner(
    [transformCode()],
    createCacheAdapterMemory()
  )(md);

  const codeNode = selectNodes(flattenTree(afterTransform))<Code>("code")[0];

  assertEquals(codeNode.html, html);
});
