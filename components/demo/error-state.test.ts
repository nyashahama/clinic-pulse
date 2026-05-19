import { describe, expect, it } from "vitest";

import { PRODUCT_LANGUAGE_BAN_LIST } from "@/lib/demo/operations-scenario";
import { getErrorStateCopy } from "@/components/demo/error-state";

describe("demo error state copy", () => {
  it("keeps fallback descriptions away from protected staged language", () => {
    const copy = getErrorStateCopy("clinic-table");
    const bannedPattern = new RegExp(
      PRODUCT_LANGUAGE_BAN_LIST.map((phrase) =>
        phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ).join("|"),
      "i",
    );

    expect(copy.description).not.toMatch(bannedPattern);
  });
});
