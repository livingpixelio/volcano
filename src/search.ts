import { getPlainText } from "./parsers/index.ts";
import type { Root } from "./parsers/markdown/MdastNode.ts";
import type { SearchHit, SearchOptions } from "./types.ts";

export const CreateSearch =
  (
    getAllTitles: () => Promise<
      Array<{
        title: string;
        slug: string;
        type: string;
      }>
    >,
    getContent: (slug: string) => Promise<Root | null>
  ) =>
  async (query: string, options?: SearchOptions): Promise<SearchHit[]> => {
    const lcQuery = query.toLowerCase();

    let hits: SearchHit[] = [];
    const titles = await getAllTitles();
    const limit =
      typeof options?.limit === "number" ? options.limit : titles.length;

    for (const title of titles) {
      if (hits.length >= limit) {
        break;
      }

      if (title.title.toLowerCase().includes(lcQuery)) {
        const hit: SearchHit = {
          slug: title.slug,
          title: title.title,
          type: title.type,
        };
        hits = [...hits, hit];
      }
    }

    for await (const title of titles) {
      if (hits.length >= limit) {
        break;
      }

      const content = await getContent(title.slug);
      if (!content) continue;

      const blocks = content.children.map((block) =>
        getPlainText(block).toLowerCase()
      );
      const blockHits = blocks
        .map((text, idx) => (text.includes(lcQuery) ? idx : -1))
        .filter((idx) => idx > -1);

      if (blockHits.length) {
        const hit: SearchHit = {
          slug: title.slug,
          title: title.title,
          type: title.type,
          blocks: blockHits,
        };
        hits = [...hits, hit];
      }
    }

    return Promise.resolve(hits);
  };
