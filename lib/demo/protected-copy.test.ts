import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRODUCT_LANGUAGE_BAN_LIST } from "@/lib/demo/operations-scenario";

const productCopyFiles = [
  "app/(demo)/admin/data-ingestion/page.tsx",
  "app/(demo)/admin/partner-readiness/page-client.tsx",
  "components/landing/landing-scenario-data.ts",
  "components/landing/proof-strip.tsx",
  "components/landing/scenario-hero.tsx",
  "components/demo/error-state.tsx",
  "lib/demo/leads.ts",
] as const;

function escapedBanPattern() {
  return new RegExp(
    PRODUCT_LANGUAGE_BAN_LIST.map((phrase) =>
      phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    ).join("|"),
    "i",
  );
}

describe("product copy", () => {
  it("does not reintroduce staged language in product-facing sources", () => {
    const bannedPattern = escapedBanPattern();

    for (const file of productCopyFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");

      expect(source, file).not.toMatch(bannedPattern);
    }
  });
});
