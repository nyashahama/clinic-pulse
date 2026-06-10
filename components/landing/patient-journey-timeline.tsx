import { PatientJourneyStep } from "@/components/landing/patient-journey-step";
import { TimelineRail } from "@/components/landing/timeline-rail";
import { patientJourneySteps } from "@/lib/landing/patient-journey-data";

export function PatientJourneyTimeline() {
  return (
    <div
      data-journey-scroll
      role="region"
      aria-label="Patient journey: how live clinic status changes the outcome"
      className="relative"
    >
      <TimelineRail stepCount={patientJourneySteps.length} />

      <ol
        role="list"
        className="flex gap-4 overflow-x-auto px-4 pb-4 pt-12 scrollbar-none snap-x snap-mandatory sm:gap-5 sm:px-8 lg:justify-center lg:overflow-x-visible lg:px-0 lg:snap-none"
      >
        {patientJourneySteps.map((stepData) => (
          <PatientJourneyStep key={stepData.step} step={stepData} />
        ))}
      </ol>
    </div>
  );
}
