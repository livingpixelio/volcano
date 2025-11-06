import { parse as parseYaml } from "@std/yaml";
import { isLeaf } from "./MdastNode.ts";

import type { MdastNode, Root, Text, Yaml } from "./MdastNode.ts";

export const flattenTree = (tree: MdastNode): MdastNode[] => {
  let nodes: MdastNode[] = [];

  const recur = (node: MdastNode) => {
    nodes = [...nodes, node];
    if (!isLeaf(node)) {
      node.children.forEach((node) => recur(node));
    }
  };
  recur(tree);

  return nodes;
};

export const selectNodes =
  (nodes: MdastNode[]) =>
  <T extends MdastNode>(...types: string[]) => {
    return nodes.filter((node) => types.includes(node.type)) as T[];
  };

export const getPlainText = (node: MdastNode) => {
  const selector = selectNodes(flattenTree(node));
  return selector<Text>("text")
    .map((node) => node.value)
    .join("\n\n");
};

// @TODO: Can speed this up by not parsing the entire tree first.
// Just select the Frontmatter and use that.
export const getFrontmatter = (content: Root): Record<string, string> => {
  const selector = selectNodes(flattenTree(content));
  const yaml = selector<Yaml>("yaml");
  // deno-lint-ignore no-explicit-any
  const data = yaml?.length ? parseYaml(yaml[0].value) : ({} as any);
  return data;
};
