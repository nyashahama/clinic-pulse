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
    <section
      data-public-surface="light"
      className="bg-[#eef3f2] px-4 py-14 text-[#17201e] sm:px-6 sm:py-18 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-screen-xl overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(23,32,30,0.10)]">
        <div className="grid gap-0 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D7A6B]">
              {incidentDemoCta.eyebrow}
            </p>
            <h2
              className="mt-4 font-display text-3xl leading-[1.08] text-[#17201e] sm:text-4xl lg:text-5xl"
              style={{ textWrap: "balance" }}
            >
              {incidentDemoCta.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-600">
              {incidentDemoCta.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink
                href={incidentDemoCta.primaryCta.href}
                variant="primary"
                className="h-12 rounded-full border-[#0D7A6B] bg-[#0D7A6B] text-white shadow-[0_14px_34px_rgba(13,122,107,0.20)] hover:bg-[#09695d] hover:ring-[#0D7A6B]/15"
              >
                {incidentDemoCta.primaryCta.label}
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink
                href={incidentDemoCta.secondaryCta.href}
                variant="secondary"
                className="h-12 rounded-full border-neutral-300 bg-white text-neutral-800 hover:border-[#0D7A6B]/40 hover:bg-emerald-50 hover:text-[#0D7A6B]"
              >
                {incidentDemoCta.secondaryCta.label}
                <ExternalLink className="size-4" />
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm leading-6 text-neutral-500">{incidentDemoCta.note}</p>
          </div>

          <div className="border-t border-neutral-200 bg-[#f7faf9] p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="grid h-full content-between gap-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[#0D7A6B]">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-950">Live incident summary</p>
                    <p className="mt-1 break-words font-mono text-xs text-neutral-500">
                      STATUS_INCIDENT / NON_FUNCTIONAL
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {incidentSummary.map((item) => (
                  <div
                    key={item.label}
                    className="grid min-w-0 gap-1 rounded-xl border border-neutral-200 bg-[#f7faf9] px-3 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      {item.label}
                    </p>
                    <p className="break-words font-mono text-sm text-neutral-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <AuditSealStream
                className="mt-2 rounded-xl border border-neutral-200 bg-[#f7faf9] p-2"
                events={ctaAuditSealEvents}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
