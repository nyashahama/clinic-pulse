import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const dataIngestionPage = path.join(
  process.cwd(),
  "app",
  "(demo)",
  "admin",
  "data-ingestion",
  "page.tsx",
);
const tenantHealthBoard = path.join(
  process.cwd(),
  "components",
  "product",
  "tenant-health-board.tsx",
);
const estateBriefing = path.join(
  process.cwd(),
  "components",
  "product",
  "estate-operations-briefing.tsx",
);

function readSource(filePath: string) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

describe("admin estate and ingestion cockpit surfaces", () => {
  it("replaces the data ingestion header/filter shell with an ingestion cockpit", () => {
    const source = readSource(dataIngestionPage);

    expect(source).toContain("EstateOperationsBriefing");
    expect(source).toContain("Ingestion command cockpit");
    expect(source).toContain("Intake queue rail");
    expect(source).toContain("Promotion route map");
    expect(source).not.toContain("AdminModuleHeader");
    expect(source).not.toContain("AdminFilterBar");
  });

  it("promotes tenant health into the estate cockpit system", () => {
    const source = readSource(tenantHealthBoard);

    expect(source).toContain("EstateOperationsBriefing");
    expect(source).toContain("Tenant health cockpit");
    expect(source).toContain("Estate scorecard rail");
    expect(source).toContain("Health routing");
  });

  it("keeps the shared estate briefing product-only and reference-neutral", () => {
    const source = readSource(estateBriefing);

    expect(source).toContain("Estate scorecard rail");
    expect(source).toContain("Health routing");
    expect(source).toContain("getEstateOperationsToneClassName");
    expect(source).not.toContain("Trigger.dev");
    expect(source).not.toContain("OpenPanel");
    expect(source).not.toContain("Appwrite");
  });
});
