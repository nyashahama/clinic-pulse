import { PatientJourneyTimeline } from "@/components/landing/patient-journey-timeline";
import { SectionHeader } from "@/components/landing/sections/section-header";

export function RealWorldStakesSection() {
  return (
    <section className="border-b border-clinics-stroke bg-clinics-bg-muted py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Real-world stakes"
          heading="A 90-minute trip."
          mutedTail="An 18-minute detour."
          subhead="One chronic medication patient at Mabopane Station Clinic. A generator failure makes the pharmacy unavailable. Without live status data, a 45-minute walk each way becomes 90 minutes wasted. With ClinicPulse, the finder warns before travel and recommends Akasia Hills—an 18-minute detour that gets the medication."
        />

        <div className="mt-16">
          <PatientJourneyTimeline />
        </div>
      </div>
    </section>
  );
}
