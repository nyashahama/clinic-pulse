import type { WorkspaceImageAsset, WorkspaceImageKey } from "@/lib/workspace/types";

export const workspaceImages: Record<WorkspaceImageKey, WorkspaceImageAsset> = {
  "clinic-front-01": {
    src: "/operations/clinics/clinic-front-01.jpg",
    alt: "Clinic entrance with triage desk and patients arriving in the morning.",
    caption: "Primary care entrance used in the district console overview.",
    credit: "ClinicPulse operations asset",
  },
  "clinic-front-02": {
    src: "/operations/clinics/clinic-front-02.jpg",
    alt: "Rural clinic frontage with pharmacy pickup window and shaded waiting area.",
    caption: "Satellite clinic frontage for routing and status views.",
    credit: "ClinicPulse operations asset",
  },
  "mobile-field-report": {
    src: "/operations/clinics/mobile-field-report.jpg",
    alt: "Field worker submitting a facility status report from a mobile device.",
    caption: "Mobile reporting context for offline and sync states.",
    credit: "ClinicPulse operations asset",
  },
  "district-operations-room": {
    src: "/operations/clinics/district-operations-room.jpg",
    alt: "District operations room with staff monitoring service availability screens.",
    caption: "Operations environment for live district monitoring.",
    credit: "ClinicPulse operations asset",
  },
  "patient-routing-context": {
    src: "/operations/clinics/patient-routing-context.jpg",
    alt: "Care navigator helping a patient choose an alternative clinic location.",
    caption: "Patient routing scenario for unavailable services.",
    credit: "ClinicPulse operations asset",
  },
};

export function getWorkspaceImage(imageKey: WorkspaceImageKey): WorkspaceImageAsset {
  return workspaceImages[imageKey];
}
