export type LandingPhoto = {
  src: string;
  alt: string;
  credit: string;
  position?: string;
};

export type LicensedLandingPhoto = LandingPhoto & {
  id: string;
  caption: string;
  sourceUrl: `https://${string}`;
  licenseLabel: string;
  licenseUrl: `https://${string}`;
};

export const landingPhotos = {
  heroClinic: {
    src: "/district/clinics/clinic-front-02.jpg",
    alt: "clinic entrance used to frame a live service availability incident",
    credit: "ClinicPulse demo healthcare operations image",
    position: "center",
  },
  fieldWorker: {
    src: "/district/clinics/mobile-field-report.jpg",
    alt: "field care context used for an offline clinic status report",
    credit: "ClinicPulse demo field reporting image",
    position: "center",
  },
  clinicTeam: {
    src: "/district/clinics/district-operations-room.jpg",
    alt: "district operations desk reviewing clinic status information",
    credit: "ClinicPulse demo operations image",
    position: "center",
  },
  patientCare: {
    src: "/district/clinics/patient-routing-context.jpg",
    alt: "patient care context connected to safer clinic routing decisions",
    credit: "ClinicPulse demo patient routing image",
    position: "center",
  },
  clinicExterior: {
    src: "/district/clinics/clinic-front-01.jpg",
    alt: "clinic status context for a public availability update",
    credit: "ClinicPulse demo clinic image",
    position: "center",
  },
} satisfies Record<string, LandingPhoto>;

export const operationalLandingPhotos = {
  heroWorker: {
    id: "hero-clinic-worker",
    src: "/landing/clinic-worker-phone.jpg",
    alt: "clinician in a white coat checking a smartphone while holding a notebook",
    credit: "Tessy Agbonome",
    caption: "Illustrative primary-care context",
    sourceUrl:
      "https://www.pexels.com/photo/doctor-sitting-with-notebook-and-smartphone-19963173/",
    licenseLabel: "Pexels License",
    licenseUrl: "https://www.pexels.com/legal-pages/license/",
    position: "center",
  },
  fieldReport: {
    id: "field-report-context",
    src: "/landing/field-report-context.jpg",
    alt: "healthcare worker outdoors speaking on a phone beside a clipboard",
    credit: "Laura James",
    caption: "Illustrative field-reporting context",
    sourceUrl:
      "https://www.pexels.com/photo/black-physician-talking-on-smartphone-at-table-on-street-6097764/",
    licenseLabel: "Pexels License",
    licenseUrl: "https://www.pexels.com/legal-pages/license/",
    position: "center 44%",
  },
  patientRoute: {
    id: "patient-route-context",
    src: "/landing/patient-route-context.jpg",
    alt: "person outdoors holding a folder while checking a smartphone",
    credit: "Charlotte May",
    caption: "Illustrative mobile-routing context",
    sourceUrl:
      "https://www.pexels.com/photo/black-woman-with-folder-using-smartphone-5965914/",
    licenseLabel: "Pexels License",
    licenseUrl: "https://www.pexels.com/legal-pages/license/",
    position: "center",
  },
} satisfies Record<string, LicensedLandingPhoto>;
