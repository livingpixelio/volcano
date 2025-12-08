import { Root } from "./parsers/markdown/MdastNode.ts";
import { SearchOptions } from "./types.ts";

export const CreateSearch =
  (
    getAllTitles: () => Promise<
      Array<{
        title: string;
        slug: string;
      }>
    >,
    getContent: (slug: string) => Promise<Root>
  ) =>
  (
    query: string,
    options?: SearchOptions
  ): Promise<Array<FileMeta & { blocks?: number[] }>> => {
    return Promise.resolve([]);
  };
