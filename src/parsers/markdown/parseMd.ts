import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";
import type { MdastNode, ParentOfText, Root } from "./MdastNode.ts";

import { parseCustom } from "./custom.ts";

const transformTextNode = (
  node: MdastNode,
  idx: number | undefined,
  parent: ParentOfText | undefined
) => {
  if (node.type !== "text") {
    return;
  }

  const { value } = node;

  const newNodes = parseCustom(value);

  if (
    !newNodes ||
    (newNodes.length === 1 && newNodes[0].type === "text") ||
    !parent ||
    typeof idx === "undefined"
  ) {
    return;
  }

  parent.children.splice(idx, 1, ...newNodes);

  parent.children.forEach((child, idx) => {
    transformTextNode(child, idx, parent);
  });
};

const pipeline = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(function () {
    return function (tree: Root) {
      visit(tree, "text", transformTextNode);
    };
  })
  .use(function toCompiler() {
    const compiler = (node: Root) => node;

    // @ts-ignore : unified's types sometimes really suck
    this.compiler = compiler;
  });

export const parseMd = (md: string) => {
  return pipeline.processSync(md).result as Root;
};
