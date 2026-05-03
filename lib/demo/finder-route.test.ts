import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDir = path.join(process.cwd(), "app");
const publicFinderPage = path.join(appDir, "finder", "page.tsx");
const publicFinderClient = path.join(appDir, "finder", "page-client.tsx");
const demoFinderPage = path.join(appDir, "(demo)", "finder", "page.tsx");

describe("public finder route boundary", () => {
  it("keeps /finder outside the authenticated demo route group", () => {
    expect(existsSync(publicFinderPage)).toBe(true);
    expect(existsSync(demoFinderPage)).toBe(false);
  });

  it("hydrates the public finder without demo-store or restricted clinic data", () => {
    expect(existsSync(publicFinderPage)).toBe(true);
    expect(existsSync(publicFinderClient)).toBe(true);

    const pageSource = readFileSync(publicFinderPage, "utf8");
    const clientSource = readFileSync(publicFinderClient, "utf8");

    expect(pageSource).toContain("fetchClinics");
    expect(pageSource).toContain("mapApiClinicDetailToClinicRow");
    expect(pageSource).not.toContain("fetchClinicReports");
    expect(pageSource).not.toContain("fetchClinicAuditEvents");
    expect(clientSource).not.toContain("useDemoStore");
    expect(clientSource).not.toContain("DemoShell");
  });
});
