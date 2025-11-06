import Prism, { typescript, jsx, tsx } from "prismjs";
import type { MdastNodeTy } from "./index.ts";

Prism.languages.typescript = typescript;
Prism.languages.PrismJsx = jsx;
Prism.languages.PrismTsx = tsx;

export default (
  code: string | undefined,
  lang: MdastNodeTy.Lang | undefined
) => {
  if (!code) return "";
  if (!lang) return code;

  try {
    return Prism.highlight(code, Prism.languages[lang], lang);
  } catch (_err) {
    return code;
  }
};
