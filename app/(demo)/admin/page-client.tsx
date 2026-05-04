"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  RefreshCcw,
  UserPlus,
  X,
} from "lucide-react";

import { DemoLeadForm } from "@/components/demo/demo-lead-form";
import { DemoLeadTable } from "@/components/demo/demo-lead-table";
import { ExportPreview } from "@/components/demo/export-preview";
import { APIPreview } from "@/components/demo/api-preview";
import { RoadmapModules } from "@/components/demo/roadmap-modules";
import { MetricTile } from "@/components/demo/metric-tile";
import { PartnerReadinessPanel } from "@/components/demo/partner-readiness-panel";
import { PilotReadinessPanel } from "@/components/demo/pilot-readiness-panel";
import { SectionHeader } from "@/components/demo/section-header";
import { Button, buttonVariants } from "@/components/ui/button";
import type {
  PartnerReadinessApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { adminWorkspaceSections } from "@/lib/demo/admin-layout";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicRows } from "@/lib/demo/selectors";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";
import type { DemoLead } from "@/lib/demo/types";
import type { DemoState } from "@/lib/demo/types";
import {
  createPartnerApiKeyAction,
  createPartnerExportAction,
  testPartnerWebhookAction,
} from "./actions";

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

type AdminPageProps = {
  syncSummary: SyncSummaryApiResponse | null;
  partnerReadiness: PartnerReadinessApiResponse;
};

type PartnerReadinessAction = "create-key" | "generate-export" | "test-webhook";

function getPartnerActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Partner readiness action failed.";
}

export default function AdminPage({
  syncSummary,
  partnerReadiness,
}: AdminPageProps) {
  const router = useRouter();
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
  const [manualLeadOpen, setManualLeadOpen] = useState(false);
  const [partnerActionPending, setPartnerActionPending] =
    useState<PartnerReadinessAction | null>(null);
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null);
  const partnerActionPendingRef = useRef<PartnerReadinessAction | null>(null);

  const leadSorted = useMemo(
    () => [...state.leads].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [state.leads],
  );
  const partnerActionInFlight = partnerActionPending !== null;

  const handleLeadSubmit = (lead: DemoLeadFormInput) => {
    addDemoLead({
      ...lead,
      createdAt: new Date().toISOString(),
      status: "new",
    });
    setManualLeadOpen(false);
  };

  const runPartnerAction = async (
    action: PartnerReadinessAction,
    mutate: () => Promise<unknown>,
  ) => {
    if (partnerActionPendingRef.current) {
      return;
    }

    partnerActionPendingRef.current = action;
    setPartnerActionPending(action);
    setPartnerActionError(null);

    try {
      await mutate();
      router.refresh();
    } catch (error) {
      setPartnerActionError(getPartnerActionErrorMessage(error));
    } finally {
      partnerActionPendingRef.current = null;
      setPartnerActionPending(null);
    }
  };

  const handleCreateDemoKey = () => {
    void runPartnerAction("create-key", () =>
      createPartnerApiKeyAction({
        name: "Demo partner integration",
        environment: "demo",
        scopes: ["clinics:read", "status:read", "alternatives:read", "exports:read"],
        allowedDistricts: [state.district],
      }),
    );
  };

  const handleGeneratePartnerExport = () => {
    void runPartnerAction("generate-export", () =>
      createPartnerExportAction({
        format: "json",
        scope: { district: state.district },
      }),
    );
  };

  const handleTestPartnerWebhook = (subscriptionId: number) => {
    void runPartnerAction("test-webhook", () => testPartnerWebhookAction(subscriptionId));
  };

  useEffect(() => {
    if (!manualLeadOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setManualLeadOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [manualLeadOpen]);

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

        {syncSummary ? <PilotReadinessPanel summary={syncSummary} /> : null}
        <PartnerReadinessPanel
          readiness={partnerReadiness}
          onCreateDemoKey={handleCreateDemoKey}
          onGenerateExport={handleGeneratePartnerExport}
          onTestWebhook={handleTestPartnerWebhook}
          pendingActions={{
            createDemoKey: partnerActionInFlight,
            generateExport: partnerActionInFlight,
            testWebhook: partnerActionInFlight,
          }}
          actionError={partnerActionError}
        />
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

      <div className="grid min-w-0 gap-4">
        <section
          className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
          data-admin-section={adminWorkspaceSections[0]}
        >
          <SectionHeader
            eyebrow="Founder pipeline"
            title="Lead management"
            description="Track booking leads from the public demo flow and move each prospect through follow-up."
            actions={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setManualLeadOpen(true)}
              >
                <UserPlus className="size-3.5" />
                Add lead manually
              </Button>
            }
          />
        </section>

        <DemoLeadTable
          leads={leadSorted}
          onLeadStatusChange={(leadId, status) => {
            updateLeadStatus(leadId, status);
          }}
        />

        <div data-admin-section={adminWorkspaceSections[1]}>
          <ExportPreview
            payload={exportPayload}
            onOpen={() => {
              // No-op stub for visual audit in this phase.
            }}
          />
        </div>

        <div data-admin-section={adminWorkspaceSections[2]}>
          <APIPreview clinicCount={clinics.length} onOpen={() => {}} />
        </div>

        <div data-admin-section={adminWorkspaceSections[3]}>
          <RoadmapModules />
        </div>

        <section
          className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm"
          data-admin-section={adminWorkspaceSections[4]}
        >
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

      {manualLeadOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-neutral-950/35 px-3 py-6 backdrop-blur-[1px] sm:place-items-center sm:px-4"
          role="presentation"
          onClick={() => setManualLeadOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Add lead manually"
            className="relative w-full max-w-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Close manual lead entry"
              className="absolute right-3 top-3 z-10 bg-bg-default"
              onClick={() => setManualLeadOpen(false)}
            >
              <X className="size-4" />
            </Button>

            <DemoLeadForm onSubmit={handleLeadSubmit} submitLabel="Add lead to pipeline" />
          </section>
        </div>
      ) : null}
    </div>
  );
}
