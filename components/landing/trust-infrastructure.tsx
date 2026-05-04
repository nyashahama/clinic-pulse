import { Braces, FileDown, ShieldCheck, type LucideIcon } from "lucide-react";

import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { trustObjects } from "@/lib/landing/openpanel-refactor-content";

export function TrustInfrastructure() {
  return (
    <LandingSection id="trust" className="border-y border-neutral-200">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <LandingSectionHeader
            eyebrow="Trust and infrastructure"
            title="Public-sector trust comes from records, not claims."
            description="Clinic Pulse keeps source, freshness, permissions, exports, partner handoffs, and audit history attached to the operating decision."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustObjects.map((object) => (
              <LandingFeatureCard
                key={object.label}
                title={object.label}
                description={object.description}
                className="min-h-40"
              >
                <p className="font-mono text-sm font-semibold text-neutral-950">
                  {object.value}
                </p>
              </LandingFeatureCard>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 text-white shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                <p className="text-sm font-semibold">Audit ledger</p>
              </div>
              <p className="font-mono text-xs text-white/40">traceable trail</p>
            </div>
            <div className="grid gap-2 p-4 font-mono text-xs text-white/70">
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                report.received_offline / field_worker / queued locally
              </p>
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                clinic.status_changed / non-functional / pharmacy stockout
              </p>
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                routing.alternative_recommended / Akasia Hills Clinic
              </p>
              <p className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                webhook.preview_recorded / partner handoff ready
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CodePanel
              icon={FileDown}
              title="District export"
              lines={[
                "CSV / incident_report",
                "district=Tshwane North Demo",
                "freshness=required",
              ]}
            />
            <CodePanel
              icon={Braces}
              title="API preview"
              lines={[
                "GET /clinics/status",
                "status=non_functional",
                "source=field_worker",
              ]}
            />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

function CodePanel({
  icon: Icon,
  lines,
  title,
}: {
  icon: LucideIcon;
  lines: readonly string[];
  title: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <div className="mt-3 rounded-md bg-neutral-950 p-3 font-mono text-xs leading-6 text-emerald-200">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
