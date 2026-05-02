import { describe, expect, it } from "vitest";

import { resolveVisibleClinicId } from "@/lib/demo/panel-state";

describe("resolveVisibleClinicId", () => {
  const clinicIds = ["clinic-a", "clinic-b", "clinic-c"];

  it("keeps the selected clinic visible while the detail panel is open", () => {
    expect(
      resolveVisibleClinicId({
        clinicIds,
        selectedClinicId: "clinic-b",
        panelOpen: true,
      }),
    ).toBe("clinic-b");
  });

  it("clears the visible clinic when the detail panel is closed", () => {
    expect(
      resolveVisibleClinicId({
        clinicIds,
        selectedClinicId: "clinic-b",
        panelOpen: false,
      }),
    ).toBeNull();
  });

  it("does not keep stale selections visible after filtering changes the clinic set", () => {
    expect(
      resolveVisibleClinicId({
        clinicIds,
        selectedClinicId: "clinic-z",
        panelOpen: true,
      }),
    ).toBeNull();
  });
});
