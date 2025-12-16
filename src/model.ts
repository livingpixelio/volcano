import z, { ZodError } from "@zod/zod";
import { getPlainText } from "./parsers/index.ts";
import type {
  CacheAdapter,
  FileMeta,
  Frontmatter,
  MdastRootTy,
  Model,
} from "./types.ts";
import type { FileEntry } from "./disk/deno.ts";
import { CreateSearch } from "./search.ts";

export const makeModel = (
  store: CacheAdapter,
  fileEntryToContent: (entry: FileEntry) => Promise<MdastRootTy>
) => {
  const createModel = <FrontmatterTy extends Frontmatter>(
    type: string,
    schema: z.ZodType<FrontmatterTy>
  ): Model<FrontmatterTy> => {
    const fullSchema = (schema as z.ZodObject<Record<string, z.Schema>>).extend(
      {
        type: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
      }
    );

    const handleParseError = (slug: string, error?: ZodError) => {
      if (error) {
        throw new Error(
          `Failed parse: type: ${type}, slug: ${slug}, zod: ${error}}`
        );
      }
    };

    const all = async () => {
      const notes = await store.listValues<{
        meta: FileMeta;
        frontmatter: FrontmatterTy;
      }>(type);

      const matches = notes
        .map(({ meta, frontmatter }) => {
          const result = fullSchema.safeParse(frontmatter);
          handleParseError(meta.slug, result.error);
          return result.success
            ? {
                slug: meta.slug,
                title: meta.title,
                frontmatter: result.data,
              }
            : null;
        })
        .filter(Boolean);

      return matches as Array<{
        title: string;
        slug: string;
        frontmatter: FrontmatterTy;
      }>;
    };

    const get = async (slug: string) => {
      const note = await store.get<{
        meta: FileMeta;
        frontmatter: FrontmatterTy;
      }>(type, slug);
      if (!note) return null;

      const parseResult = fullSchema.safeParse(note.frontmatter);
      handleParseError(note.meta.slug, parseResult.error);

      return {
        slug: note.meta.slug,
        title: note.meta.title,
        frontmatter: note.frontmatter,
      };
    };

    const getContent = async (slug: string) => {
      const note = await store.get<{
        meta: FileMeta;
        frontmatter: FrontmatterTy;
      }>(type, slug);
      if (!note) return null;

      const parseResult = fullSchema.safeParse(note.frontmatter);
      handleParseError(note.meta.slug, parseResult.error);
      return fileEntryToContent(note.meta.file);
    };

    const getText = async (slug: string) => {
      const content = await getContent(slug);
      if (!content) return null;
      return getPlainText(content);
    };

    const search = CreateSearch(async () => {
      const items = await all();
      return items.map((item) => ({
        title: item.title,
        slug: item.slug,
        type,
      }));
    }, getContent);

    return {
      all,
      get,
      getContent,
      getText,
      search,
    };
  };

  return createModel;
};
