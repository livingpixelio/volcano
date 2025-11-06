import { crypto } from "@std/crypto";
import { encodeHex } from "@std/encoding/hex";

export const getChecksum = async (
  data: Uint8Array<ArrayBuffer>
): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(digest);
};
