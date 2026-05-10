import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const clinicTable = path.join(process.cwd(), "components", "demo", "clinic-table.tsx");
const demoLeadTable = path.join(process.cwd(), "components", "demo", "demo-lead-table.tsx");

describe("responsive demo work queues", () => {
  it("gives the clinic table a mobile card queue before the wide desktop table", () => {
    const source = readFileSync(clinicTable, "utf8");

    expect(source).toContain('aria-label="Clinic mobile work queue"');
    expect(source).toContain('className="grid gap-3 px-4 pb-4 md:hidden"');
    expect(source).toContain('className="hidden min-w-0 overflow-x-auto px-4 pb-4 md:block"');
    expect(source).toContain("Recommended action");
  });

  it("gives demo leads a mobile card queue with status controls", () => {
    const source = readFileSync(demoLeadTable, "utf8");

    expect(source).toContain('aria-label="Demo leads mobile work queue"');
    expect(source).toContain('className="grid gap-3 px-4 pb-4 md:hidden"');
    expect(source).toContain('className="hidden overflow-x-auto px-4 pb-4 md:block"');
    expect(source).toContain("Update status for");
  });
});
