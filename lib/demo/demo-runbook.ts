type DemoViewport = "desktop" | "mobile";

type DemoRouteChecklistEntry = {
  path: string;
  proofMoment: string;
  viewports: DemoViewport[];
};

export const phaseOneDemoRouteChecklist: DemoRouteChecklistEntry[] = [
  {
    path: "/",
    proofMoment: "Landing page explains ClinicPulse and routes the viewer into booking or demo workspace.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/book-demo",
    proofMoment: "Booking flow captures a lead without requiring a backend.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/book-demo/thanks",
    proofMoment: "Confirmation page gives clear next navigation into demo, admin, or finder.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/demo",
    proofMoment: "District console shows clinic status, incidents, routing, and live scenario controls.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/demo/clinics/clinic-mamelodi-east",
    proofMoment: "Clinic detail explains status evidence and can escalate context into admin.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/finder",
    proofMoment: "Public finder makes clinic availability searchable without login.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/field",
    proofMoment: "Field report flow demonstrates offline-friendly reporting and sync.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/admin",
    proofMoment: "Admin shows lead pipeline, export proof, API preview, roadmap, and notes in one vertical workflow.",
    viewports: ["desktop", "mobile"],
  },
];
