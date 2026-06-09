import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { phaseOneDemoRouteChecklist } from "@/lib/demo/demo-runbook";
import { PRODUCT_LANGUAGE_BAN_LIST } from "@/lib/demo/operations-scenario";

const RUNBOOK_LANGUAGE_BAN_LIST = [
  ...PRODUCT_LANGUAGE_BAN_LIST,
  "demonstrates",
  "feature tour",
  "founder demo",
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("phaseOneDemoRouteChecklist", () => {
  it("covers every route in the operations walkthrough order", () => {
    expect(phaseOneDemoRouteChecklist.map((entry) => entry.path)).toEqual([
      "/",
      "/request-walkthrough",
      "/request-walkthrough/thanks",
      "/district",
      "/district/clinics/clinic-mabopane-station",
      "/finder",
      "/field",
      "/admin",
    ]);
  });

  it("defines operations proof moments without staged demo wording", () => {
    const serialized = JSON.stringify(phaseOneDemoRouteChecklist);
    const escapedBanList = RUNBOOK_LANGUAGE_BAN_LIST.map(escapeRegExp);

    expect(serialized).not.toMatch(new RegExp(escapedBanList.join("|"), "i"));

    for (const entry of phaseOneDemoRouteChecklist) {
      expect(entry.proofMoment.length).toBeGreaterThan(12);
      expect(entry.viewports).toEqual(["desktop", "mobile"]);
    }
  });

  it("keeps clinic detail proof aligned with the showcase capture route", () => {
    const clinicDetail = phaseOneDemoRouteChecklist.find((entry) =>
      entry.path.startsWith("/district/clinics/"),
    );
    const showcaseCaptureSpec = readFileSync(
      path.join(process.cwd(), "tests", "showcase", "capture-assets.spec.ts"),
      "utf8",
    );

    expect(clinicDetail).toMatchObject({
      path: "/district/clinics/clinic-mabopane-station",
      proofMoment:
        "Clinic detail shows Mabopane Station incident evidence, patient routing impact, report history, and escalation path.",
    });
    expect(showcaseCaptureSpec).toContain(`gotoStable(page, "${clinicDetail?.path}")`);
  });
});
