import type { DemoImageAsset, DemoImageKey } from "@/lib/demo/types";

export const demoImages: Record<DemoImageKey, DemoImageAsset> = {
  "clinic-front-01": {
    src: "/demo/clinics/clinic-front-01.jpg",
    alt: "Clinic entrance with triage desk and patients arriving in the morning.",
    caption: "Primary care entrance used in the district console overview.",
    credit: "ClinicPulse demo asset",
  },
  "clinic-front-02": {
    src: "/demo/clinics/clinic-front-02.jpg",
    alt: "Rural clinic frontage with pharmacy pickup window and shaded waiting area.",
    caption: "Satellite clinic frontage for routing and status views.",
    credit: "ClinicPulse demo asset",
  },
  "mobile-field-report": {
    src: "/demo/clinics/mobile-field-report.jpg",
    alt: "Field worker submitting a facility status report from a mobile device.",
    caption: "Mobile reporting context for offline and sync states.",
    credit: "ClinicPulse demo asset",
  },
  "district-operations-room": {
    src: "/demo/clinics/district-operations-room.jpg",
    alt: "District operations room with staff monitoring service availability screens.",
    caption: "Operations environment for live district monitoring.",
    credit: "ClinicPulse demo asset",
  },
  "patient-routing-context": {
    src: "/demo/clinics/patient-routing-context.jpg",
    alt: "Care navigator helping a patient choose an alternative clinic location.",
    caption: "Patient routing scenario for unavailable services.",
    credit: "ClinicPulse demo asset",
  },
};

export function getDemoImage(imageKey: DemoImageKey): DemoImageAsset {
  return demoImages[imageKey];
}
