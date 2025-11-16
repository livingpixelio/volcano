import { define } from "../utils.ts";
import { openVault } from "@lps/volcano";
import * as path from "@std/path";
import z from "jsr:@zod/zod@^4.1.12";

export const handler = define.handlers({
  async GET() {
    const vault = await openVault({
      path: path.join(Deno.cwd(), "content"),
    });

    const model = vault.createModel(
      "Post",
      z.object({
        date_published: z.coerce.date(),
      })
    );

    const content = await model.all();

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
