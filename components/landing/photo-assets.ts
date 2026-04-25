export type LandingPhoto = {
  src: string;
  alt: string;
  credit: string;
  position?: string;
};

export const landingPhotos = {
  heroClinic: {
    src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=85",
    alt: "Healthcare workers reviewing patient information in a bright clinic setting",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
  fieldWorker: {
    src: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=85",
    alt: "Healthcare professional preparing clinical equipment",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
  clinicTeam: {
    src: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85",
    alt: "Clinical team working in a hospital corridor",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
  patientCare: {
    src: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=1200&q=85",
    alt: "Clinician speaking with a patient during a care visit",
    credit: "Unsplash healthcare photography",
    position: "center",
  },
} satisfies Record<string, LandingPhoto>;
