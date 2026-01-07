import { Image } from "@cross/image";
import * as path from "@std/path";

const aBytes = await Deno.readFile(path.join(Deno.cwd(), "A.jpg"));
const aImg = await Image.decode(aBytes, "jpeg");
const aImgPrime = await aImg.encode("jpeg");
await Deno.writeFile(path.join(Deno.cwd(), "aPrime.jpg"), aImgPrime);

const bBytes = await Deno.readFile(path.join(Deno.cwd(), "B.png"));
const bImg = await Image.decode(bBytes, "png");
const bImgPrime = await bImg.encode("png");
await Deno.writeFile(path.join(Deno.cwd(), "bPrime.png"), bImgPrime);
