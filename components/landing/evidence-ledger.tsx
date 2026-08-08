import { ArrowDown, Braces, FileDown, Link2, ShieldCheck } from "lucide-react";

import { OperationalStatus } from "@/components/landing/operational-status";
import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

const ledgerEvents = [
  {
    stage: operationalNarrative.stages[0],
    verb: "Report accepted",
    source: operationalNarrative.incident.source,
    value: `${operationalNarrative.clinics[0].name} / ${operationalNarrative.incident.service}`,
  },
  {
    stage: operationalNarrative.stages[1],
    verb: "Service status changed",
    source: operationalNarrative.incident.reporter,
    value: "Operational → Non-functional",
  },
  {
    stage: operationalNarrative.stages[2],
    verb: "Compatible route recommended",
    source: "District routing review",
    value: operationalNarrative.clinics[1].name,
  },
  {
    stage: operationalNarrative.stages[3],
    verb: "Operating record sealed",
    source: "Linked incident events",
    value: operationalNarrative.incident.auditId,
  },
] as const;

const capabilityIcons = [FileDown, Braces, Link2] as const;

export function EvidenceLedger() {
  return (
    <section
      id="trust-and-evidence"
      data-landing-chapter="evidence-ledger"
      className="dark scroll-mt-20 overflow-hidden bg-landing-ledger px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-[80rem] gap-12 lg:grid-cols-[minmax(19rem,0.62fr)_minmax(0,1.38fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="grid size-11 place-items-center rounded-xl border border-landing-mint/25 bg-landing-mint/10 text-landing-mint">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-7 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-landing-mint">
            {operationalNarrative.ledger.eyebrow}
          </p>
          <h2 className="mt-5 max-w-[13ch] font-display text-4xl leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            {operationalNarrative.ledger.title}
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/64 sm:text-base">
            {operationalNarrative.ledger.description}
          </p>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">
            {operationalNarrative.disclosure}
          </p>
        </div>

        <div className="min-w-0">
          <article className="overflow-hidden rounded-[1.125rem] border border-white/13 bg-[#062f2a] shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
            <header className="flex flex-col gap-5 border-b border-white/12 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-landing-mint/70">
                  Operating record
                </p>
                <h3 className="mt-2 font-mono text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl">
                  {operationalNarrative.incident.auditId}
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/48">
                <span className="size-2 rounded-full bg-landing-mint" aria-hidden="true" />
                4 linked events
              </div>
            </header>

            <ol className="px-4 sm:px-6">
              {ledgerEvents.map((event, index) => (
                <li
                  key={event.stage.id}
                  className="relative grid min-w-0 gap-4 border-b border-white/10 py-6 last:border-b-0 sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:gap-6"
                >
                  <div className="relative">
                    <p className="font-mono text-sm font-semibold text-landing-mint">
                      {event.stage.time}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                      Event {event.stage.step}
                    </p>
                    {index < ledgerEvents.length - 1 ? (
                      <ArrowDown
                        className="absolute -bottom-7 left-1 hidden size-3.5 text-landing-mint/42 sm:block"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{event.verb}</p>
                    <dl className="mt-3 grid min-w-0 gap-2 text-xs leading-5">
                      <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                        <dt className="font-mono uppercase tracking-[0.09em] text-white/38">Source</dt>
                        <dd className="min-w-0 break-words text-white/65">{event.source}</dd>
                      </div>
                      <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                        <dt className="font-mono uppercase tracking-[0.09em] text-white/38">Value</dt>
                        <dd className="min-w-0 break-words font-semibold text-white/88">
                          {event.value}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <OperationalStatus tone={event.stage.tone} className="w-fit sm:justify-self-end">
                    {event.stage.statusLabel}
                  </OperationalStatus>
                </li>
              ))}
            </ol>
          </article>

          <ul className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12 sm:grid-cols-3">
            {operationalNarrative.ledger.capabilities.map((capability, index) => {
              const Icon = capabilityIcons[index];
              return (
                <li key={capability.label} className="min-w-0 bg-landing-ledger p-4">
                  <Icon className="size-4 text-landing-mint" aria-hidden="true" />
                  <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-white/38">
                    {capability.label}
                  </p>
                  <p className="mt-1.5 text-xs font-semibold leading-5 text-white/82">
                    {capability.value}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
