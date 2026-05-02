"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  RefreshCcw,
  Users,
} from "lucide-react";

import { DemoLeadForm } from "@/components/demo/demo-lead-form";
import { DemoLeadTable } from "@/components/demo/demo-lead-table";
import { ExportPreview } from "@/components/demo/export-preview";
import { APIPreview } from "@/components/demo/api-preview";
import { RoadmapModules } from "@/components/demo/roadmap-modules";
import { MetricTile } from "@/components/demo/metric-tile";
import { SectionHeader } from "@/components/demo/section-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicRows } from "@/lib/demo/selectors";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";
import type { DemoLead } from "@/lib/demo/types";
import type { DemoState } from "@/lib/demo/types";

type LeadStatusCount = Record<DemoLead["status"], number>;

function buildLeadStatusCounts(leads: DemoLead[]): LeadStatusCount {
  return leads.reduce(
    (accumulator, lead) => {
      accumulator[lead.status] = accumulator[lead.status] + 1;
      return accumulator;
    },
    { new: 0, contacted: 0, scheduled: 0, completed: 0 },
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildExportPayload(state: DemoState) {
  const clinics = getClinicRows(state);

  return {
    generatedAt: new Date().toISOString(),
    district: state.district,
    province: state.province,
    clinics: clinics.map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
      facilityCode: clinic.facilityCode,
      status: clinic.status,
      freshness: clinic.freshness,
      reason: clinic.reason,
    })),
    leads: state.leads.map((lead) => ({
      ...lead,
    })),
    alerts: state.auditEvents,
    reports: state.reports.map((report) => ({
      id: report.id,
      clinicId: report.clinicId,
      status: report.status,
      reason: report.reason,
      receivedAt: report.receivedAt,
      source: report.source,
    })),
  };
}

export default function AdminPage() {
  const searchParams = useSearchParams();
  const {
    state,
    resetDemo,
    addDemoLead,
    updateLeadStatus,
  } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const selectedClinicId = searchParams.get("clinicId");
  const selectedClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === selectedClinicId),
    [clinics, selectedClinicId],
  );

  const leadStatusCount = useMemo(() => buildLeadStatusCounts(state.leads), [state.leads]);
  const alertCount = state.alerts.length;
  const queuedReports = state.offlineQueue.length;
  const activeAlertCount = state.alerts.filter((alert) => alert.status === "open").length;
  const exportPayload = useMemo(() => buildExportPayload(state), [state]);

  const leadSorted = useMemo(
    () => [...state.leads].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [state.leads],
  );

  const handleLeadSubmit = (lead: DemoLeadFormInput) => {
    addDemoLead({
      ...lead,
      createdAt: new Date().toISOString(),
      status: "new",
    });
  };

  return (
    <div className="grid gap-4 pb-4">
      <div className="grid gap-4">
        <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <SectionHeader
            eyebrow="Founder operations"
            title="Admin control deck"
            description="Use this surface to capture leads, review seeded state, and prepare a premium demo handoff."
          />
          <p className="mt-2 text-sm leading-6 text-content-subtle">
            You are editing live mock data. Use demo controls and export surfaces to simulate how a
            founder-led demo ends with a clean, shareable artifact.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={resetDemo}>
              <RefreshCcw className="size-3.5" />
              Reset demo state
            </Button>
            <Link
              href="/book-demo"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open external booking flow
            </Link>
            <Link
              href="/field"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <AlertCircle className="size-3.5" />
              Field reporting
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile
            label="Leads"
            count={state.leads.length}
            description="Booked founder demos and inbound lead volume."
            trend={{
              value: `${leadStatusCount.new} new`,
              direction: leadStatusCount.new > 0 ? "up" : "flat",
              context: "Fresh prospect pipeline from booking page.",
            }}
          />
          <MetricTile
            label="Open alerts"
            count={activeAlertCount}
            description="Operational escalations visible to district users."
            trend={{
              value: `${alertCount} total`,
              direction: activeAlertCount > 0 ? "down" : "up",
              context: "Higher means faster decision support is needed.",
            }}
          />
          <MetricTile
            label="Queued reports"
            count={queuedReports}
            description="Offline submissions waiting for sync simulation."
            trend={{
              value: `Export payload built`,
              direction: queuedReports > 0 ? "down" : "flat",
              context: "Local-state-only for demo reliability.",
            }}
          />
        </div>
      </div>

      {selectedClinic ? (
        <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                Escalation context
              </p>
              <h2 className="mt-1 text-lg font-semibold text-content-emphasis">
                {selectedClinic.name}
              </h2>
              <p className="mt-1 text-sm text-content-default">
                Routed from clinic detail as an escalation target. Reason last updated:{" "}
                {formatDate(selectedClinic.lastReportedAt)}.
              </p>
            </div>
            <Link
              href={`/finder?query=${encodeURIComponent(selectedClinic.name)}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <ArrowLeft className="size-3.5" />
              Open in finder
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="grid min-w-0 gap-4">
          <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
            <SectionHeader
              eyebrow="Manual lead capture"
              title="Add custom demo lead"
              description="Useful for rehearsal runs or founder-led warm-ups before sharing a link."
              actions={
                <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-subtle px-2 py-1 text-xs text-content-subtle">
                  <Users className="size-3.5" />
                  Internal queue
                </span>
              }
            />

            <DemoLeadForm onSubmit={handleLeadSubmit} submitLabel="Add lead to demo queue" />
          </section>

          <DemoLeadTable
            leads={leadSorted}
            onLeadStatusChange={(leadId, status) => {
              updateLeadStatus(leadId, status);
            }}
          />

          <ExportPreview
            payload={exportPayload}
            onOpen={() => {
              // No-op stub for visual audit in this phase.
            }}
          />
        </div>

        <div className="grid min-w-0 gap-4">
          <APIPreview clinicCount={clinics.length} onOpen={() => {}} />
          <RoadmapModules />
          <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
            <SectionHeader
              eyebrow="Ops snapshot"
              title="Quick notes"
              description="Short list of talking points before the founder pitch starts."
            />
            <ul className="mt-4 space-y-2 text-sm text-content-default">
              <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
                <span className="font-medium text-content-emphasis">Demo flow:</span>{" "}
                Start at <span className="font-mono">/demo</span>, then open finder and field flows.
              </li>
              <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
                <span className="font-medium text-content-emphasis">Escalation path:</span>{" "}
                Use alert list and status actions to show reroute confidence.
              </li>
              <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
                <span className="font-medium text-content-emphasis">Lead capture:</span>{" "}
                Bookings in <span className="font-mono">/book-demo</span> are persisted in local storage.
              </li>
              <li className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2">
                <span className="font-medium text-content-emphasis">Admin proof:</span>{" "}
                Export payload and API schema are intentionally mock-first for solo founder pacing.
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-content-subtle">
              <CalendarClock className="size-4" />
              Last admin interaction: {formatDate(new Date().toISOString())}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
