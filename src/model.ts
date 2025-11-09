import z, { ZodError } from "@zod/zod";
import { CacheAdapter, FileMeta, Frontmatter, Model } from "./types.ts";
import { openFile } from "./disk/deno.ts";
import { getPlainText, parseMd } from "./parsers/index.ts";

export const makeModel = (vaultPath: string, store: CacheAdapter) => {
  const createModel = <FrontmatterTy extends Frontmatter>(
    type: string,
    schema: z.ZodObject<Record<string, z.Schema>>
  ): Model<FrontmatterTy> => {
    const fullSchema = schema.extend({
      type: z.string().nullable().optional(),
      slug: z.string().nullable().optional(),
    });

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

      const matches = notes.filter(({ meta, frontmatter }) => {
        const result = fullSchema.safeParse(frontmatter);
        handleParseError(meta.slug, result.error);
        return result.success;
      });

      return matches.map((match) => ({
        slug: match.meta.slug,
        title: match.meta.title,
        frontmatter: match.frontmatter,
      }));
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
      const data = await openFile(vaultPath, note.meta.file);
      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(data);
      const content = parseMd(text);
      return content;
    };

    const getText = async (slug: string) => {
      const content = await getContent(slug);
      if (!content) return null;
      return getPlainText(content);
    };

    return {
      all,
      get,
      getContent,
      getText,
    };
  };

  return createModel;
};
