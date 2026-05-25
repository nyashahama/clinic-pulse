import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PRODUCT_LANGUAGE_BAN_LIST } from "@/lib/demo/operations-scenario";

const productCopyFiles = [
  "app/(workspace)/admin/data-ingestion/page.tsx",
  "app/(workspace)/admin/partner-readiness/page-client.tsx",
  "app/(auth)/register/page.tsx",
  "app/(legal)/legal/safety/page.tsx",
  "app/(legal)/legal/terms/page.tsx",
  "components/landing/booking-hero.tsx",
  "components/landing/booking-demo-controller.tsx",
  "components/landing/landing-scenario-data.ts",
  "components/landing/nav.tsx",
  "components/landing/product-flow.tsx",
  "components/landing/proof-strip.tsx",
  "components/landing/routing-moment.tsx",
  "components/landing/scenario-hero.tsx",
  "components/landing/workflow-incident-panel.tsx",
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
