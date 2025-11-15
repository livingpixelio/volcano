import { FileMeta } from "../../types.ts";

/**
 * Root
 */
export interface Root {
  type: "root";
  children: Block[];
}

/**
 * BLOCKS
 */
export interface Yaml {
  type: "yaml";
  value: string;
}

export interface Heading {
  type: "heading";
  depth: number;
  children: Inline[];
}

export interface Paragraph {
  type: "paragraph";
  children: Inline[];
}

export interface List {
  type: "list";
  ordered: boolean;
  children: Array<ListItem>;
}

export interface ListItem {
  type: "listItem";
  children: [Paragraph | List];
}

export interface Blockquote {
  type: "blockquote";
  children: Paragraph[];
}

export type Lang =
  | "typescript"
  | "javascript"
  | "jsx"
  | "tsx"
  | "css"
  | "html"
  | "python"
  | "php";

export interface Code {
  type: "code";
  value: string;
  lang: Lang;
  html?: string;
}

export interface ThematicBreak {
  type: "thematicBreak";
}

export type Block =
  | Yaml
  | Heading
  | Paragraph
  | Blockquote
  | List
  | ListItem
  | Code
  | ThematicBreak
  | Attachment;

/**
 * Inline and text
 */

export interface Link {
  type: "link";
  url: string;
  children: Inline[];
}

export interface XLink {
  type: "xlink";
  filename: string;
  children: Inline[];
  file?: FileMeta;
}

export interface Emphasis {
  type: "emphasis";
  children: Inline[];
}

export interface Strong {
  type: "strong";
  children: Inline[];
}

export interface Text {
  type: "text";
  value: string;
}

export interface InlineCode {
  type: "inlineCode";
  value: string;
}

export interface Image {
  type: "image";
  url: string;
  alt: string;
}

export type Branch = Paragraph;

export interface Attachment {
  type: "attachment";
  filename: string;
  extension: string;
  alt?: string;
  file?: FileMeta;
}

export type Inline =
  | Link
  | XLink
  | Image
  | Attachment
  | Shortcode
  | Emphasis
  | Strong
  | Text
  | InlineCode;

export interface Shortcode {
  type: "shortcode";
  name: string;
  [key: string]: string | undefined;
}

export type Leaf =
  | Yaml
  | ThematicBreak
  | Text
  | Code
  | InlineCode
  | Image
  | Attachment
  | Shortcode;

export type MdastNode = Root | Block | Inline | Attachment | Shortcode;

export type ParentOfText =
  | Heading
  | Paragraph
  | Link
  | XLink
  | Emphasis
  | Strong;

export const isLeaf = (node: MdastNode): node is Leaf => {
  return !(node as Root).children;
};
