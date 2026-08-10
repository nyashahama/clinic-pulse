import { ArrowRight, ClipboardCheck, ExternalLink } from "lucide-react";

import { ButtonLink } from "@/components/landing/button-link";
import { AuditSealStream } from "@/components/landing/motion/audit-seal-stream";
import { incidentDemoCta } from "@/lib/landing/openpanel-refactor-content";
import { auditSealEvents } from "@/lib/landing/landing-motion-content";

const ctaAuditSealEvents = auditSealEvents.filter(
  (event) => event.id !== "seal-route",
);

export function IncidentDemoCTA() {
  const incidentSummary = [
    { label: "Source clinic", value: incidentDemoCta.incident.sourceClinic },
    { label: "Reroute", value: incidentDemoCta.incident.reroute },
    { label: "Audit record", value: incidentDemoCta.incident.auditRecord },
  ] as const;

  return (
    <section className="bg-[#070908] px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-screen-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b0d0c] text-white shadow-[0_36px_120px_rgba(0,0,0,0.45)]">
        <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              {incidentDemoCta.eyebrow}
            </p>
            <h2
              className="mt-4 font-display text-3xl leading-[1.08] text-white sm:text-4xl lg:text-5xl"
              style={{ textWrap: "balance" }}
            >
              {incidentDemoCta.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">
              {incidentDemoCta.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink
                href={incidentDemoCta.primaryCta.href}
                variant="primary"
                className="h-11 rounded-full border-white bg-white text-neutral-950 shadow-[0_16px_44px_rgba(0,0,0,0.32)] hover:bg-white/88 hover:ring-white/20"
              >
                {incidentDemoCta.primaryCta.label}
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink
                href={incidentDemoCta.secondaryCta.href}
                variant="secondary"
                className="h-11 rounded-full border-white/14 bg-transparent text-white/72 hover:border-white/32 hover:bg-white/[0.06] hover:text-white"
              >
                {incidentDemoCta.secondaryCta.label}
                <ExternalLink className="size-4" />
              </ButtonLink>
            </div>
            <p className="mt-5 text-xs leading-5 text-white/55">{incidentDemoCta.note}</p>
          </div>

          <div className="border-t border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="grid h-full content-between gap-6 rounded-lg border border-white/10 bg-neutral-900 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-emerald-300/30 bg-neutral-950 text-emerald-300">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Live incident summary</p>
                    <p className="mt-1 break-words font-mono text-xs text-white/55">
                      STATUS_INCIDENT / NON_FUNCTIONAL
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {incidentSummary.map((item) => (
                  <div
                    key={item.label}
                    className="grid min-w-0 gap-1 rounded-md border border-white/10 bg-neutral-950 px-3 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                      {item.label}
                    </p>
                    <p className="break-words font-mono text-sm text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <AuditSealStream
                className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-2"
                events={ctaAuditSealEvents}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
