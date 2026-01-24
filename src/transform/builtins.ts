import { Prism } from "prism-esm";
import { loader as jsxLoader } from "prism-esm/components/prism-jsx.js";
import { loader as tsxLoader } from "prism-esm/components/prism-tsx.js";
import { loader as tsLoader } from "prism-esm/components/prism-typescript.js";

import {
  Attachment,
  Code,
  MdastNode,
  XLink,
} from "../parsers/markdown/MdastNode.ts";
import { Transformer } from "../types.ts";
import { createLog } from "../log.ts";

interface TransformCodeArgs {
  extendPrism?: (prism: Prism) => void;
  onFailedTransform?: "warn" | "die" | "ignore";
}

export const transformCode = (args?: TransformCodeArgs): Transformer => {
  const prism = new Prism();
  jsxLoader(prism);
  tsxLoader(prism);
  tsLoader(prism);

  args?.extendPrism && args?.extendPrism(prism);

  return (node: MdastNode) => {
    if (node.type !== "code") return false;

    const _node = node as Code;
    // TODO: add positions to the MdastTy annotations
    // deno-lint-ignore no-explicit-any
    const offset: number = (node as any).position.start.offset;

    if (!_node.value) return false;
    if (!_node.lang) return false;

    try {
      const html = prism.highlight(
        _node.value,
        prism.languages[_node.lang],
        _node.lang,
      );
      return {
        key: `code:${offset}`,
        transform: () => ({
          ...node,
          html,
        }),
      };
    } catch (err) {
      if (args?.onFailedTransform === "die") {
        throw err;
      }
      if (args?.onFailedTransform === "warn") {
        createLog("warn").failure(
          `Prism highlightling failed, offset: ${offset}`,
        );
      }
      return false;
    }
  };
};

interface GetFileMetaArgs {
  onFailedTransform?: "warn" | "die" | "ignore";
}

export const getFileMeta =
  (args?: GetFileMetaArgs): Transformer =>
  (node: MdastNode) => {
    if (!["xlink", "attachment"].includes(node.type)) {
      return false;
    }
    const _node = node as Attachment | XLink;
    return {
      key: `${_node.type}:${_node.filename}`,
      transform: (getDataFromFilename) => {
        return getDataFromFilename(
          _node.type === "xlink"
            ? _node.filename
            : `${_node.filename}${_node.extension}`,
        )
          .then((file) => {
            if (!file) {
              throw new Error("MissingFile");
            }
            return {
              ..._node,
              file,
            };
          })
          .catch((err) => {
            if (args?.onFailedTransform === "die") {
              throw err;
            }
            if (args?.onFailedTransform === "warn") {
              createLog("warn").failure(
                `Unable to get data for referenced file: ${_node.filename}`,
              );
            }
            return false;
          });
      },
    };
  };

export const builtins = [transformCode(), getFileMeta()];
