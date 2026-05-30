import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const clinicTable = path.join(process.cwd(), "components", "workspace", "clinic-table.tsx");
const walkthroughLeadTable = path.join(process.cwd(), "components", "workspace", "walkthrough-lead-table.tsx");

describe("responsive workspace work queues", () => {
  it("gives the clinic table a mobile card queue before the wide desktop table", () => {
    const source = readFileSync(clinicTable, "utf8");

    expect(source).toContain('aria-label="Clinic mobile work queue"');
    expect(source).toContain('className="grid gap-3 px-4 pb-4 md:hidden"');
    expect(source).toContain('className="hidden min-w-0 overflow-x-auto px-4 pb-4 md:block"');
    expect(source).toContain("Recommended action");
  });

  it("gives operations leads a mobile card queue with status controls", () => {
    const source = readFileSync(walkthroughLeadTable, "utf8");

    expect(source).toContain('aria-label="Operations leads mobile work queue"');
    expect(source).toContain('className="grid gap-3 px-4 pb-4 md:hidden"');
    expect(source).toContain('className="hidden overflow-x-auto px-4 pb-4 md:block"');
    expect(source).toContain("Update status for");
  });
});
