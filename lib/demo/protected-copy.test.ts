import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRODUCT_LANGUAGE_BAN_LIST } from "@/lib/demo/operations-scenario";

const protectedCopyFiles = [
  "app/(demo)/admin/data-ingestion/page.tsx",
  "app/(demo)/admin/partner-readiness/page-client.tsx",
  "components/demo/error-state.tsx",
] as const;

function escapedBanPattern() {
  return new RegExp(
    PRODUCT_LANGUAGE_BAN_LIST.map((phrase) =>
      phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ).join("|"),
    "i",
  );
}

describe("protected product copy", () => {
  it("does not reintroduce staged language in protected admin surfaces", () => {
    const bannedPattern = escapedBanPattern();

    for (const file of protectedCopyFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");

      expect(source, file).not.toMatch(bannedPattern);
    }
  });
});
