"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FieldClinicList } from "@/components/demo/field-clinic-list";
import { OfflineQueue } from "@/components/demo/offline-queue";
import { ReportForm } from "@/components/demo/report-form";
import { SyncStatus } from "@/components/demo/sync-status";
import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  submitOnlineFieldReport,
  type OnlineFieldReportInput,
} from "@/lib/demo/field-report";
import { getClinicRows } from "@/lib/demo/selectors";
import { createFieldReport } from "./actions";

export default function FieldPage() {
  const router = useRouter();
  const {
    state,
    queueOfflineReport,
    syncOfflineReports,
    submitFieldReport,
  } = useDemoStore();

  const clinics = useMemo(() => getClinicRows(state), [state]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    clinics[0]?.id ?? null,
  );
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const selectedClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === selectedClinicId) ?? clinics[0] ?? null,
    [clinics, selectedClinicId],
  );

  const selectedName = selectedClinic?.name ?? "Select a clinic";
  const selectedId = selectedClinic?.id ?? "";

  const handleSubmit = async (report: OnlineFieldReportInput) => {
    if (submitInFlight.current) {
      return false;
    }

    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);

    if (!selectedId) {
      submitInFlight.current = false;
      setSubmitting(false);
      return false;
    }

    try {
      if (isOnline) {
        await submitOnlineFieldReport({
          clinicId: selectedId,
          refresh: () => router.refresh(),
          report,
          submitReport: createFieldReport,
          submitFieldReport,
        });

        return true;
      }

      // Phase 2 keeps offline mode as a browser-local demo queue.
      // Durable offline sync semantics are intentionally deferred to Phase 4.
      queueOfflineReport({
        clinicId: selectedId,
        reporterName: report.reporterName,
        source: "field_worker",
        status: report.status,
        reason: report.reason,
        staffPressure: report.staffPressure,
        stockPressure: report.stockPressure,
        queuePressure: report.queuePressure,
        notes: report.notes,
        submittedAt: report.submittedAt,
      });

      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Online report submission failed. Try again when the API is reachable.",
      );
      return false;
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleSync = () => {
    if (!isOnline || state.offlineQueue.length === 0) {
      return;
    }

    setSyncing(true);
    syncOfflineReports();
    setTimeout(() => setSyncing(false), 600);
  };

  return (
    <div className="grid gap-4 pb-4">
      <div className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Field worker"
          title="Mobile reporting flow"
          description="Submit a clinic update from offline or online mode. Queued items merge into district state when back online."
        />
        <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-content-subtle">
            Clinic status stream is currently {isOnline ? "online" : "offline"}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOnline((current) => !current)}
            className="w-full sm:w-auto"
          >
            {isOnline ? "Set offline mode" : "Set online mode"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <FieldClinicList
          clinics={clinics}
          selectedClinicId={selectedId}
          onSelectClinic={setSelectedClinicId}
        />
        <ReportForm
          clinicId={selectedId}
          clinicName={selectedName}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
        {submitError ? (
          <p className="xl:col-start-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OfflineQueue
          queue={state.offlineQueue}
          clinics={clinics}
          canSync={isOnline}
          syncing={syncing}
          onSync={handleSync}
        />

        <SyncStatus
          isOnline={isOnline}
          queuedReports={state.offlineQueue.length}
          lastSyncedAt={state.lastSyncAt}
          onToggleOnline={() => setIsOnline((current) => !current)}
          canRetry={state.offlineQueue.length > 0}
          onRetry={state.offlineQueue.length > 0 ? handleSync : undefined}
        />
      </div>

      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Field to district"
          title="What happens next"
          description="Online submissions go straight to district state; offline submissions land in queue."
        />
        <div className="mt-3 grid gap-2 text-sm">
          <p className="text-content-subtle">
            1) Pick a clinic from your assigned list.
          </p>
          <p className="text-content-subtle">
            2) Complete status, staffing, stock, queue, and notes.
          </p>
          <p className="text-content-subtle">
            3) In offline mode, report stays queued and is sent to district when you press sync.
          </p>
          <p className="text-content-subtle">
            4) Open{" "}
            <Link href="/demo" className="text-primary underline underline-offset-4">
              /demo
            </Link>{" "}
            to verify the report stream updates in the operations screen.
          </p>
        </div>
      </section>
    </div>
  );
}
