export { runner } from "./runner.ts";
export { builtins } from "./builtins.ts";

import * as Tr from "./builtins.ts";
export const Transformers = {
  transformCode: Tr.transformCode,
  getFileMeta: Tr.getFileMeta,
};
