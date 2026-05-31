import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("admin export and API contract pages", () => {
  it("presents the export schema as a handoff cockpit instead of a copied command shell", () => {
    const source = readFileSync("app/(demo)/admin/export-schema/page.tsx", "utf8");

    expect(source).toContain("Export contract cockpit");
    expect(source).toContain("Handoff packet");
    expect(source).toContain("Source evidence");
    expect(source).toContain("Field contract");
    expect(source).toContain("Value guardrails");
    expect(source).toContain("/admin/api-contract?from=admin-export-schema");
    expect(source).not.toContain("Export schema command centre");
  });

  it("turns the API contract page into a route-native API reference cockpit", () => {
    const source = readFileSync("app/(demo)/admin/api-contract/page.tsx", "utf8");

    expect(source).toContain("API contract cockpit");
    expect(source).toContain("Endpoint rail");
    expect(source).toContain("Request contract");
    expect(source).toContain("Response contract");
    expect(source).toContain("Safety boundary");
    expect(source).toContain("Consumer handoff");
    expect(source).toContain("evidenceHref");
    expect(source).not.toContain('AdminDetailJsonBlock title="Endpoint contract"');
  });
});
