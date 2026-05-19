import { describe, expect, it } from "vitest";

import { DEMO_DISTRICT, DEMO_PROVINCE } from "@/lib/demo/clinics";
import {
  DISTRICT_OPERATIONS_DISTRICT,
  DISTRICT_OPERATIONS_PROVINCE,
  OPERATIONS_INCIDENT,
  PRODUCT_LANGUAGE_BAN_LIST,
} from "@/lib/demo/operations-scenario";

describe("district operations scenario", () => {
  it("defines one canonical district incident lifecycle", () => {
    expect(DISTRICT_OPERATIONS_DISTRICT).toBe("Tshwane North District");
    expect(OPERATIONS_INCIDENT.sourceClinicId).toBe("clinic-mabopane-station");
    expect(OPERATIONS_INCIDENT.sourceClinicName).toBe("Mabopane Station Clinic");
    expect(OPERATIONS_INCIDENT.affectedService).toBe("Pharmacy");
    expect(OPERATIONS_INCIDENT.recommendedAlternativeName).toBe("Akasia Hills Clinic");
    expect(OPERATIONS_INCIDENT.lifecycle).toEqual([
      "signal_received",
      "district_triage",
      "field_update",
      "admin_review",
      "monitoring",
    ]);
  });

  it("keeps user-facing scenario copy away from demo framing", () => {
    const serialized = JSON.stringify({
      district: DISTRICT_OPERATIONS_DISTRICT,
      incident: OPERATIONS_INCIDENT,
    }).toLowerCase();

    for (const banned of PRODUCT_LANGUAGE_BAN_LIST) {
      expect(serialized).not.toContain(banned.toLowerCase());
    }
  });

  it("keeps legacy clinic constants aligned to the district operations scenario", () => {
    expect(DEMO_PROVINCE).toBe(DISTRICT_OPERATIONS_PROVINCE);
    expect(DEMO_DISTRICT).toBe(DISTRICT_OPERATIONS_DISTRICT);
  });
});
