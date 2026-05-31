import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("admin export and API contract pages", () => {
  it("presents the export schema as a handoff cockpit instead of a copied command shell", () => {
    const source = readFileSync("app/(demo)/admin/export-schema/page.tsx", "utf8");
    const model = readFileSync("lib/product/export-schema.ts", "utf8");
    const workspace = readFileSync(
      "components/product/export-schema-workspace.tsx",
      "utf8",
    );

    expect(source).toContain("Export contract cockpit");
    expect(source).toContain("Handoff packet");
    expect(source).toContain("buildExportSchemaModel");
    expect(source).toContain("ExportSchemaWorkspace");
    expect(workspace).toContain('aria-label="Export schema workspace"');
    expect(workspace).toContain('aria-label="Schema section list"');
    expect(workspace).toContain('aria-label="Selected schema section"');
    expect(workspace).toContain('aria-label="Field contract"');
    expect(workspace).toContain("onSelectSection(section.id)");
    expect(model).toContain("OpenMetadata data contract schema table");
    expect(model).toContain("OpenMetadata contract quality card");
    expect(model).toContain("buildAdminExportRunDetailHref");
    expect(source).toContain("/admin/api-contract?from=admin-export-schema");
    expect(source).not.toContain("Export schema command centre");
  });

  it("turns the API contract page into a route-native API reference cockpit", () => {
    const source = readFileSync("app/(demo)/admin/api-contract/page.tsx", "utf8");
    const model = readFileSync("lib/product/api-contract.ts", "utf8");
    const workspace = readFileSync("components/product/api-contract-workspace.tsx", "utf8");

    expect(source).toContain("API contract cockpit");
    expect(source).toContain("buildApiContractModel");
    expect(source).toContain("ApiContractWorkspace");
    expect(workspace).toContain('aria-label="API contract workspace"');
    expect(workspace).toContain('aria-label="Contract endpoint list"');
    expect(workspace).toContain('aria-label="Selected endpoint contract"');
    expect(workspace).toContain('aria-label="Request parameters"');
    expect(workspace).toContain('aria-label="Response contract"');
    expect(workspace).toContain('aria-label="Sample payload"');
    expect(workspace).toContain("onSelectEndpoint(endpoint.id)");
    expect(model).toContain("Swagger UI operation components");
    expect(model).toContain("OpenMetadata data contract schema table");
    expect(model).toContain("buildAdminExportRunDetailHref");
    expect(source).not.toContain('AdminDetailJsonBlock title="Endpoint contract"');
  });
});
