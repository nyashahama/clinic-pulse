import { describe, expect, it } from "vitest";

import { accessReviewSourceReferences } from "@/lib/product/access-review";

describe("access review source references", () => {
  it("documents the open-source patterns behind the access review queue", () => {
    expect(accessReviewSourceReferences.map((reference) => reference.source)).toEqual([
      "Infisical Permission Audit",
      "Keycloak effective role mappings",
      "Supabase Team Settings",
      "Logto user roles",
      "Unkey roles table",
      "Twenty role assignment",
    ]);
    expect(accessReviewSourceReferences.map((reference) => reference.licenseUse)).toEqual([
      "adaptable",
      "adaptable",
      "adaptable",
      "reference-only",
      "reference-only",
      "reference-only",
    ]);
    expect(accessReviewSourceReferences.every((reference) => reference.sourcePath)).toBe(true);
  });
});
