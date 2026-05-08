import { AuditSealStream } from "@/components/landing/motion/audit-seal-stream";
import { trustEvidencePanels } from "@/lib/landing/openpanel-refactor-content";

export function EvidenceInfrastructure() {
  return (
    <section id="trust" className="border-y border-neutral-800 bg-neutral-950 px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-screen-xl gap-10 py-16 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:py-24">
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
            Every operating decision keeps its source, permissions, freshness,
            audit reference, export state, and partner handoff visible for public-sector review.
          </p>
        </div>

        <div className="grid min-w-0 gap-4">
          <AuditSealStream className="rounded-xl border border-white/10 bg-white/[0.04] p-2" />

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {trustEvidencePanels.map((panel) => (
              <article
                key={panel.title}
                className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-5"
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
          </div>
        </div>
      </div>
    </section>
  );
}
