import { SectionHeader } from "@/components/landing/sections/section-header";

const PILLARS = [
  {
    number: "01",
    title: "Audit-first, not dashboard-first",
    body: "Every screen starts from the question: what did the auditor need to see today? Not what the manager wants to glance at.",
  },
  {
    number: "02",
    title: "Decisions on the record",
    body: "No Slack threads, no buried emails. Every recommendation, override, and sign-off lives in the audit trail.",
  },
  {
    number: "03",
    title: "Built for the people who run the stations",
    body: "Not for head-office reporting. For the service manager who needs to know at 06:45 whether last night's handover left gaps.",
  },
];

/**
 * ClinicPulse manifesto — three numbered pillars. Serif headings,
 * paper background, single-column list. No animated quotes.
 */
export function Manifesto() {
  return (
    <section id="manifesto" className="bg-clinics-paper py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader
          eyebrow="Manifesto"
          heading="Built for the people who run the stations."
          subhead="Three principles that shaped every screen in ClinicPulse."
        />

        <ol className="mt-16 space-y-12">
          {PILLARS.map((p) => (
            <li
              key={p.number}
              className="grid grid-cols-[3rem_1fr] gap-6 border-t border-clinics-stone pt-8"
            >
              <span className="font-mono text-sm text-clinics-canopy">
                {p.number}
              </span>
              <div>
                <h3 className="font-serif text-2xl text-clinics-ink">
                  {p.title}
                </h3>
                <p className="mt-3 text-clinics-ink-mute">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
