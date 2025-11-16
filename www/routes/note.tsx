import { define } from "../utils.ts";
import { openVault } from "@lps/volcano";
import * as path from "@std/path";

export const handler = define.handlers({
  async GET() {
    const vault = await openVault({
      path: path.join(Deno.cwd(), "content"),
    });

    const content = await vault.getContent("volcano");

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
