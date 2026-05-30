export type LandingPhoto = {
  src: string;
  alt: string;
  credit: string;
  position?: string;
};

export const landingPhotos = {
  heroClinic: {
    src: "/operations/clinics/clinic-front-02.jpg",
    alt: "clinic entrance used to frame a live service availability incident",
    credit: "ClinicPulse healthcare operations image",
    position: "center",
  },
  fieldWorker: {
    src: "/operations/clinics/mobile-field-report.jpg",
    alt: "field care context used for an offline clinic status report",
    credit: "ClinicPulse field reporting image",
    position: "center",
  },
  clinicTeam: {
    src: "/operations/clinics/district-operations-room.jpg",
    alt: "district operations desk reviewing clinic status information",
    credit: "ClinicPulse operations image",
    position: "center",
  },
  patientCare: {
    src: "/operations/clinics/patient-routing-context.jpg",
    alt: "patient care context connected to safer clinic routing decisions",
    credit: "ClinicPulse patient routing image",
    position: "center",
  },
  clinicExterior: {
    src: "/operations/clinics/clinic-front-01.jpg",
    alt: "clinic status context for a public availability update",
    credit: "ClinicPulse clinic image",
    position: "center",
  },
} satisfies Record<string, LandingPhoto>;
