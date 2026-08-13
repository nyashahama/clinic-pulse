import { AuditSealStream } from "@/components/landing/motion/audit-seal-stream";
import { MobileSwipeRail } from "@/components/landing/mobile-swipe-rail";
import { trustEvidencePanels } from "@/lib/landing/openpanel-refactor-content";

export function EvidenceInfrastructure() {
  return (
    <section id="trust" className="border-y border-white/[0.08] bg-[#050606] px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-screen-xl gap-8 py-14 sm:py-18 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-12 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Trust evidence
          </p>
          <h2
            className="mt-4 font-display text-3xl leading-[1.08] text-white sm:text-4xl lg:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Public-sector trust lives in the evidence chain.
          </h2>
          <p className="mt-5 text-base leading-7 text-white/62 sm:text-lg">
            In the scenario, every decision keeps its source, permissions,
            freshness, audit reference, export state, and partner handoff visible.
          </p>
          <p className="mt-6 border-l border-emerald-300/40 pl-4 font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-white/56">
            Modeled product evidence · not deployment telemetry
          </p>
        </div>

        <div className="grid min-w-0 gap-4">
          <AuditSealStream className="rounded-xl border border-white/10 bg-white/[0.04] p-2" />

          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/56 sm:hidden">
            Swipe to inspect the evidence objects
          </p>
          <MobileSwipeRail
            ariaLabel="Evidence objects"
            className="grid w-full min-w-0 snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-3 overflow-x-auto pb-4 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0"
          >
            {trustEvidencePanels.map((panel) => (
              <article
                key={panel.title}
                className="min-w-0 snap-start rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{panel.title}</p>
                    <p className="mt-1 break-words font-mono text-xs text-emerald-300">
                      {panel.label}
                    </p>
                  </div>

                  <div className="grid gap-2 border-t border-white/10 pt-4">
                    {panel.lines.map((line) => (
                      <p
                        key={line}
                        className="min-w-0 break-all rounded-md border border-white/10 bg-neutral-900 px-3 py-2 font-mono text-xs leading-5 text-white/72"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </MobileSwipeRail>
        </div>
      </div>
    </section>
  );
}
