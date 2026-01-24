import { OpenVaultOptions } from "./types.ts";

export const createLog = (logLevel: OpenVaultOptions["log"]) => {
  const success = (msg: string) => {
    if (logLevel !== "build") return;

    console.log(`%c\u2713 %cVolcano: ${msg}`, "color: green", "color: white");
  };

  const failure = (msg: string) => {
    if (!logLevel || logLevel === "silent") return;

    console.log(
      `%cX %cVolcano: ${msg}`,
      "color: red; font-style: italic",
      "color: white",
    );
  };

  return { success, failure };
};
