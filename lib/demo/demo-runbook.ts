type DemoViewport = "desktop" | "mobile";

type DemoRouteChecklistEntry = {
  path: string;
  proofMoment: string;
  viewports: DemoViewport[];
};

export const phaseOneDemoRouteChecklist: DemoRouteChecklistEntry[] = [
  {
    path: "/",
    proofMoment: "Landing page introduces the operations workflow and routes users into booking or sign-in.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/book-demo",
    proofMoment: "Booking flow captures an operations walkthrough request.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/book-demo/thanks",
    proofMoment: "Confirmation page gives clear next navigation into district, finder, field, and admin work.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/demo",
    proofMoment: "District command center opens the Mabopane Station incident from severity queue to action.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/demo/clinics/clinic-mabopane-station",
    proofMoment:
      "Clinic detail shows Mabopane Station incident evidence, patient routing impact, report history, and escalation path.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/finder",
    proofMoment: "Public finder makes clinic availability searchable without login.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/field",
    proofMoment: "Field report flow captures assigned-clinic updates and offline sync state.",
    viewports: ["desktop", "mobile"],
  },
  {
    path: "/admin",
    proofMoment: "Admin shows review pressure, governance actions, partner evidence, and readiness blockers.",
    viewports: ["desktop", "mobile"],
  },
];
