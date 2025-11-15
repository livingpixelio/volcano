import Prism from "prismjs";
import {
  Attachment,
  Code,
  MdastNode,
  XLink,
} from "../parsers/markdown/MdastNode.ts";
import { Transformer } from "../types.ts";
import { warn } from "../log.ts";

// Prism.languages.typescript = typescript;
// Prism.languages.PrismJsx = jsx;
// Prism.languages.PrismTsx = tsx;

export const transformCode = (
  // The first argument is just a handle to extend Prism, which is poorly
  // typed. So just use any.
  // deno-lint-ignore no-explicit-any
  extendPrism?: (Prism: any) => void
): Transformer => {
  extendPrism && extendPrism(Prism);

  return (node: MdastNode) => {
    if (node.type !== "code") return false;

    const _node = node as Code;
    // TODO: add positions to the MdastTy annotations
    // deno-lint-ignore no-explicit-any
    const offset: number = (node as any).position.start.offset;

    if (!_node.value) return false;
    if (!_node.lang) return false;

    try {
      const html = Prism.highlight(
        _node.value,
        Prism.languages[_node.lang],
        _node.lang
      );
      return {
        key: `code:${offset}`,
        transform: () => ({
          ...node,
          html,
        }),
      };
    } catch (_err) {
      warn(`Prism highlightling failed, offset: ${offset}`);
      return false;
    }
  };
};

export const getFileMeta: Transformer = (node: MdastNode) => {
  if (!["xlink", "attachment"].includes(node.type)) {
    return false;
  }
  const _node = node as Attachment | XLink;
  return {
    key: `${_node.type}:${_node.filename}`,
    transform: (getDataFromFilename) => {
      return getDataFromFilename(_node.filename)
        .then((file) => {
          if (!file) {
            warn(`Unable to get data for referenced file: ${_node.filename}`);
            return node;
          }
          return {
            ..._node,
            file,
          };
        })
        .catch(() => {
          warn(`Unable to get data for referenced file: ${_node.filename}`);
          return node;
        });
    },
  };
};

export const builtins = [transformCode(), getFileMeta];
