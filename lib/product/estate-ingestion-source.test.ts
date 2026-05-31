import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const dataIngestionPage = path.join(
  process.cwd(),
  "app",
  "(workspace)",
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
    const monitorSource = readSource(
      path.join(process.cwd(), "components", "product", "data-ingestion-pipeline-monitor.tsx"),
    );

    expect(source).toContain("DataIngestionPipelineMonitor");
    expect(source).toContain("Ingestion pipeline monitor");
    expect(monitorSource).toContain("Source pipeline map");
    expect(monitorSource).toContain("Ingestion failure-origin inspector");
    expect(monitorSource).toContain("Pipeline run history");
    expect(monitorSource).toContain("Inspect pipeline stage");
    expect(monitorSource).toContain("Inspect run step");
    expect(monitorSource).toContain("Stage triage queue");
    expect(monitorSource).toContain("Active ingestion issue");
    expect(monitorSource).toContain("Mark stage reviewed");
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EstateOperationsBriefing");
    expect(source).not.toContain("AdminModuleHeader");
    expect(source).not.toContain("AdminFilterBar");
  });

  it("promotes tenant health into a distinct estate map", () => {
    const source = readSource(tenantHealthBoard);

    expect(source).toContain("Tenant estate health map");
    expect(source).toContain("District readiness heatmap");
    expect(source).toContain("Estate signal switchboard");
    expect(source).not.toContain("EvidenceCommandHeader");
    expect(source).not.toContain("EvidenceCommandMetricStrip");
    expect(source).not.toContain("EvidenceCaseBriefPanel");
    expect(source).not.toContain("EstateOperationsBriefing");
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
