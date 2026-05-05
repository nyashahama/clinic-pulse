"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AuditTrail } from "@/components/demo/audit-trail";
import { ClinicOperationalGrid } from "@/components/demo/clinic-operational-grid";
import { ClinicProfileHeader } from "@/components/demo/clinic-profile-header";
import { ReroutePanel, type RerouteRecommendation } from "@/components/demo/reroute-panel";
import { Button } from "@/components/ui/button";
import {
  loadAlternativeRecommendations,
  resolveAlternativeService,
} from "@/lib/demo/alternatives";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicAuditEvents, getClinicReports, getClinicRows } from "@/lib/demo/selectors";
import type { Clinic, ClinicRow } from "@/lib/demo/types";

type LocalRerouteRecommendation = RerouteRecommendation & {
  distanceKm: number;
  estimatedMinutes: number;
};

function toDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDistanceKm(fromClinic: Clinic, toClinic: Clinic) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const radiusKm = 6371;

  const lat1 = toRadians(fromClinic.latitude);
  const lat2 = toRadians(toClinic.latitude);
  const deltaLat = toRadians(toClinic.latitude - fromClinic.latitude);
  const deltaLng = toRadians(toClinic.longitude - fromClinic.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * radiusKm * Math.asin(Math.sqrt(a));
}

function buildRerouteRecommendations(
  sourceClinic: ClinicRow,
  candidates: ClinicRow[],
): LocalRerouteRecommendation[] {
  const compatibilityRows = candidates
    .filter((clinic) => clinic.id !== sourceClinic.id)
    .filter(
      (clinic) =>
        clinic.status === "operational" || (clinic.status === "degraded" && clinic.freshness !== "stale"),
    )
    .map((clinic) => {
      const compatibilityServices = clinic.services.filter((service) =>
        sourceClinic.services.includes(service),
      );

      if (compatibilityServices.length === 0) {
        return null;
      }

      const distanceKm = getDistanceKm(sourceClinic, clinic);
      const estimatedMinutes = Math.max(6, Math.round((distanceKm / 35) * 60));
      const reason =
        clinic.status === "operational"
          ? "Operational and can absorb overflow demand immediately."
          : "Degraded but can support selected shared services with elevated wait times.";

      return {
        clinic,
        compatibilityServices,
        distanceKm,
        estimatedMinutes,
        reason,
      };
    })
    .filter((entry): entry is LocalRerouteRecommendation => entry !== null)
    .sort((left, right) => {
      const statusRank = (status: ClinicRow["status"]) =>
        status === "operational" ? 0 : 1;

      const statusDelta = statusRank(left.clinic.status) - statusRank(right.clinic.status);
      if (statusDelta !== 0) {
        return statusDelta;
      }

      return left.distanceKm - right.distanceKm;
    })
    .slice(0, 4);

  return compatibilityRows;
}

function isUnavailableClinic(status: ClinicRow["status"], freshness: ClinicRow["freshness"]) {
  return (
    status === "non_functional" ||
    status === "unknown" ||
    freshness === "stale" ||
    freshness === "needs_confirmation"
  );
}

function getClinicName(clinicId: string | string[] | undefined) {
  if (!clinicId) {
    return "";
  }

  return Array.isArray(clinicId) ? clinicId[0] : clinicId;
}

type RecommendationResult = {
  key: string;
  recommendations: RerouteRecommendation[];
};

export default function ClinicDetailPage() {
  const router = useRouter();
  const { state } = useDemoStore();
  const params = useParams<{ clinicId?: string | string[] }>();
  const clinicId = getClinicName(params.clinicId);

  const clinicRows = useMemo(() => getClinicRows(state), [state]);
  const clinicRow = useMemo(
    () => clinicRows.find((entry) => entry.id === clinicId) ?? null,
    [clinicId, clinicRows],
  );

  const reports = useMemo(
    () => (clinicId ? getClinicReports(state, clinicId) : []),
    [clinicId, state],
  );
  const auditEvents = useMemo(
    () => (clinicId ? getClinicAuditEvents(state, clinicId) : []),
    [clinicId, state],
  );

  const recommendationKey = clinicRow
    ? `${clinicRow.id}:${resolveAlternativeService(clinicRow, clinicRow.services[0])}`
    : "";
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult>({
    key: "",
    recommendations: [],
  });
  const recommendations =
    recommendationResult.key === recommendationKey ? recommendationResult.recommendations : [];

  useEffect(() => {
    let isCurrent = true;
    const abortController = new AbortController();

    if (!clinicRow) {
      abortController.abort();
      return;
    }

    void loadAlternativeRecommendations({
      sourceClinic: clinicRow,
      localClinics: clinicRows,
      requestedService: clinicRow.services[0],
      apiOptions: {
        init: {
          signal: abortController.signal,
        },
      },
      localFallback: () => buildRerouteRecommendations(clinicRow, clinicRows),
      onFetchError: (error) => {
        console.warn("Unable to fetch backend reroute alternatives.", error);
      },
    }).then((nextRecommendations) => {
      if (isCurrent) {
        setRecommendationResult({
          key: recommendationKey,
          recommendations: nextRecommendations,
        });
      }
    });

    return () => {
      isCurrent = false;
      abortController.abort();
    };
  }, [clinicRow, clinicRows, recommendationKey]);

  const latestReason = useMemo(
    () => reports[0]?.reason ?? clinicRow?.reason ?? "No reason has been reported yet.",
    [reports, clinicRow?.reason],
  );

  const unavailableClinic = clinicRow
    ? isUnavailableClinic(clinicRow.status, clinicRow.freshness)
    : false;

  return (
    <div className="grid gap-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-content-emphasis">Clinic detail</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/demo")}
          className="inline-flex"
        >
          <ArrowLeft className="size-4" />
          Back to console
        </Button>
      </div>

      {!clinicRow ? (
        <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-sm text-content-subtle">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-content-emphasis">Clinic not found</p>
              <p className="mt-1 max-w-xl">
                The requested clinic id {clinicId ? `"${clinicId}"` : "was not provided"} could not be
                matched to the current mock district roster.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {clinicRow ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,1.1fr)]">
          <div className="grid gap-4">
            <ClinicProfileHeader
              clinic={{ ...clinicRow, reason: latestReason }}
              onFindAlternative={() =>
                router.push(
                  `/finder?query=${encodeURIComponent(clinicRow.name)}&service=${encodeURIComponent(
                    clinicRow.services[0] ?? "",
                  )}`,
                )
              }
              onEscalate={() => router.push(`/admin?clinicId=${encodeURIComponent(clinicRow.id)}`)}
            />

            <ClinicOperationalGrid
              clinic={{
                ...clinicRow,
                reason: latestReason,
              }}
            />

            <AuditTrail clinicName={clinicRow.name} events={auditEvents} />
          </div>

          <div className="grid gap-4">
            <ReroutePanel
              sourceClinicName={clinicRow.name}
              unavailable={unavailableClinic}
              reason={latestReason}
              recommendations={recommendations}
            />
          </div>
        </div>
      ) : null}

      {clinicRow ? (
        <div className="grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <p className="text-sm font-medium text-content-emphasis">Report history</p>
          {reports.length === 0 ? (
            <p className="text-sm text-content-subtle">No reports exist for this clinic yet.</p>
          ) : (
            <div className="grid gap-2">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-border-subtle p-3 text-sm text-content-default"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-content-emphasis">{report.reporterName}</p>
                    <p className="font-mono text-xs text-content-subtle">{toDate(report.receivedAt)}</p>
                  </div>
                  <p className="mt-1 capitalize text-content-subtle">
                    {report.source.replaceAll("_", " ")} · {report.status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 leading-6 text-content-default">
                    {report.reason}
                    {report.notes ? ` — ${report.notes}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
