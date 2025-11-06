import { Attachment, Shortcode, Text, XLink } from "./MdastNode.ts";

const take = (
  from: string,
  to: string,
  testContents?: (contents: string) => boolean,
) => {
  const parse = (
    input: string,
    skip?: number,
  ): [string, string, string] | null => {
    const startIndex = input.indexOf(from, skip);
    if (startIndex < 0) {
      return null;
    }
    const endIndex = input.slice(startIndex + from.length).indexOf(to) +
      startIndex +
      from.length;
    if (endIndex < startIndex + from.length) {
      return null;
    }

    const head = input.slice(0, startIndex);
    const contents = input.slice(startIndex + from.length, endIndex);
    const rest = input.slice(endIndex + to.length);

    if (testContents && !testContents(contents)) {
      return parse(input, endIndex);
    }

    return [head, contents, rest];
  };

  return (input: string) => parse(input);
};

const takeImage = take("![[", "]]");
const takeXLink = take("[[", "]]");
const takeShortcode = take("[", "]");

export const parseCustom = (
  input: string,
): Array<Text | XLink | Attachment | Shortcode> | null => {
  const image = takeImage(input);
  if (image) {
    const nodeParts = image[1].split("|");
    const filenameParts = nodeParts[0].split(".");

    if (filenameParts.length < 2) {
      return reparse(image.map((value) => ({
        type: "text",
        value,
      })));
    }

    const node: Attachment = {
      type: "attachment",
      filename: filenameParts[0],
      extension: `.${filenameParts[1]}`,
      alt: nodeParts[1],
    };

    return reparse([
      { type: "text", value: image[0] },
      node,
      { type: "text", value: image[2] },
    ]);
  }

  const xlink = takeXLink(input);
  if (xlink) {
    const nodeParts = xlink[1].split("|");
    const node: XLink = {
      type: "xlink",
      filename: nodeParts[0],
      children: [
        { type: "text", value: nodeParts[1] || nodeParts[0] },
      ],
    };
    return reparse([
      { type: "text", value: xlink[0] },
      node,
      { type: "text", value: xlink[2] },
    ]);
  }

  const shortcode = takeShortcode(input);
  if (shortcode) {
    const nodeParts = shortcode[1].split(" ");
    const node: Shortcode = {
      type: "shortcode",
      name: nodeParts[0],
      ...parseShortcodeAttr(nodeParts[1]),
    };
    return reparse([
      { type: "text", value: shortcode[0] },
      node,
      { type: "text", value: shortcode[2] },
    ]);
  }

  return null;
};

const reparse = (inputs: Array<Text | XLink | Attachment | Shortcode>) => {
  return inputs.reduce((acc, input) => {
    if (input.type !== "text") return [...acc, input];
    if (!input.value) return acc;
    const result = parseCustom(input.value);
    return result ? [...acc, ...result] : [...acc, input];
  }, [] as Array<Text | XLink | Attachment | Shortcode>);
};

export const parseShortcodeAttr = (input?: string): Record<string, string> => {
  let result: Record<string, string> = {};

  const recur = (input?: string) => {
    if (!input) return;

    const equalsIndex = input.indexOf("=");
    if (equalsIndex < 0) return;
    const key = input.slice(0, equalsIndex).trim();
    const tail = input.slice(equalsIndex + 1);
    if (!tail) return;

    const isDoubleQuoted = tail.charAt(0) === '"';
    if (isDoubleQuoted) {
      const parts = take('"', '"')(tail);
      if (!parts) return;
      result = {
        ...result,
        [key]: parts[1],
      };
      recur(parts[2]);
      return;
    }

    const isSingleQuoted = tail.charAt(0) === "'";
    if (isSingleQuoted) {
      const parts = take("'", "'")(tail);
      if (!parts) return;
      result = {
        ...result,
        [key]: parts[1],
      };
      recur(parts[2]);
      return;
    }

    const spaceIndex = tail.indexOf(" ");
    if (spaceIndex < 0) {
      result = {
        ...result,
        [key]: tail,
      };
      return;
    }
    result = {
      ...result,
      [key]: tail.slice(0, spaceIndex),
    };
    recur(tail.slice(spaceIndex + 1));
  };

  recur(input);

  return result;
};
