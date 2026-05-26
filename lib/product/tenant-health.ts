import type { AuthRole } from "@/lib/auth/api";
import type {
  AdminUserAccessApiResponse,
  ClinicDetailApiResponse,
  PartnerReadinessApiResponse,
  ReportApiResponse,
  SyncSummaryApiResponse,
} from "@/lib/demo/api-types";
import { buildPartnerReadinessModel } from "@/lib/demo/partner-readiness";
import {
  classifyAccessRisk,
  summarizeReportingCoverage,
} from "@/lib/product/admin-governance";

export type TenantHealthTone = "clear" | "attention" | "blocked" | "info";

export type TenantHealthAction = {
  label: string;
  href: string;
  icon: "stream" | "shield" | "plug";
  priority: "primary" | "secondary";
};

export type TenantHealthMetric = {
  label: string;
  value: string;
  detail: string;
  tone: TenantHealthTone;
};

export type TenantHealthDistrictRow = {
  id: string;
  district: string;
  clinics: number;
  freshnessRisk: number;
  pendingReports: number;
  readinessPercent: number;
  tone: TenantHealthTone;
  statusLabel: string;
  detail: string;
};

export type TenantHealthSignal = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: TenantHealthTone;
  href: string;
  actionLabel: string;
};

export type TenantHealthSourceReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

export type TenantHealthViewModel = {
  header: {
    eyebrow: string;
    title: string;
    description: string;
    score: {
      label: string;
      value: string;
      detail: string;
      tone: TenantHealthTone;
    };
    scope: string;
  };
  actions: TenantHealthAction[];
  metrics: TenantHealthMetric[];
  districtStack: {
    title: string;
    description: string;
    rows: TenantHealthDistrictRow[];
  };
  signalLedger: {
    title: string;
    description: string;
    items: TenantHealthSignal[];
  };
  sourceReferences: TenantHealthSourceReference[];
};

export type TenantHealthInput = {
  clinics: ClinicDetailApiResponse[];
  pendingReports: ReportApiResponse[];
  partnerReadiness: PartnerReadinessApiResponse;
  syncSummary: SyncSummaryApiResponse;
  users: AdminUserAccessApiResponse[];
};

const adminRoles = new Set<AuthRole>([
  "reporter",
  "district_manager",
  "org_admin",
  "system_admin",
]);
const numberFormatter = new Intl.NumberFormat("en-ZA");
const sourceReferences: TenantHealthSourceReference[] = [
  {
    source: "Supabase Studio",
    role: "Tenant estate shell, concise health sections, and operator-first page hierarchy.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
  {
    source: "OpenStatus",
    role: "Reliability language for freshness, uptime-style health, and clear incident posture.",
    href: "https://github.com/openstatusHQ/openstatus",
    licenseUse: "reference-only",
  },
  {
    source: "Twenty",
    role: "Dense back-office relationship ledger for districts, accounts, and activity history.",
    href: "https://github.com/twentyhq/twenty",
    licenseUse: "reference-only",
  },
  {
    source: "shadcn dashboard",
    role: "Compact metric cards and accessible primitives for repeat operational review.",
    href: "https://github.com/shadcn-ui/ui",
    licenseUse: "adaptable",
  },
];

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function distinctValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function formatSignalList(parts: string[]) {
  return parts.length ? parts.join("; ") : "No active blocker";
}

function isFresh(clinic: ClinicDetailApiResponse) {
  return clinic.currentStatus?.freshness === "fresh";
}

function toneForPressure(value: number): TenantHealthTone {
  return value > 0 ? "attention" : "clear";
}

function toneForReadiness(readinessPercent: number, pressure: number): TenantHealthTone {
  if (readinessPercent < 70) {
    return "blocked";
  }

  if (readinessPercent < 100 || pressure > 0) {
    return "attention";
  }

  return "clear";
}

function accessRiskCount(users: AdminUserAccessApiResponse[]) {
  return users
    .map((user) => {
      if (adminRoles.has(user.role as AuthRole)) {
        return classifyAccessRisk({
          role: user.role as AuthRole,
          disabled: Boolean(user.disabledAt),
          district: user.district,
          lastSeenAt: user.lastSeenAt,
        });
      }

      return { reasons: ["Unrecognised role assignment"] };
    })
    .filter((risk) => risk.reasons.length > 0).length;
}

function buildDistrictRows(
  clinics: ClinicDetailApiResponse[],
  pendingReports: ReportApiResponse[],
): TenantHealthDistrictRow[] {
  const reportsByClinic = new Map<string, number>();

  for (const report of pendingReports) {
    reportsByClinic.set(report.clinicId, (reportsByClinic.get(report.clinicId) ?? 0) + 1);
  }

  const clinicsByDistrict = new Map<string, ClinicDetailApiResponse[]>();

  for (const clinic of clinics) {
    const district = clinic.clinic.district || "District unavailable";
    clinicsByDistrict.set(district, [...(clinicsByDistrict.get(district) ?? []), clinic]);
  }

  return Array.from(clinicsByDistrict.entries())
    .map(([district, districtClinics]) => {
      const freshnessRisk = districtClinics.filter((clinic) => !isFresh(clinic)).length;
      const pendingReportCount = districtClinics.reduce(
        (count, clinic) => count + (reportsByClinic.get(clinic.clinic.id) ?? 0),
        0,
      );
      const readinessPercent = districtClinics.length
        ? Math.round(((districtClinics.length - freshnessRisk) / districtClinics.length) * 100)
        : 0;
      const pressure = freshnessRisk + pendingReportCount;

      return {
        id: district.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        district,
        clinics: districtClinics.length,
        freshnessRisk,
        pendingReports: pendingReportCount,
        readinessPercent,
        tone: toneForReadiness(readinessPercent, pressure),
        statusLabel: pressure ? "Needs review" : "Clear",
        detail: formatSignalList([
          freshnessRisk
            ? `${formatCount(freshnessRisk)} freshness risks`
            : "All clinic signals fresh",
          pendingReportCount
            ? `${formatCount(pendingReportCount)} pending field reports`
            : "No pending field reports",
        ]),
      } satisfies TenantHealthDistrictRow;
    })
    .sort((left, right) => {
      const readinessDelta = left.readinessPercent - right.readinessPercent;

      if (readinessDelta !== 0) {
        return readinessDelta;
      }

      return right.pendingReports - left.pendingReports;
    });
}

export function buildTenantHealthViewModel({
  clinics,
  pendingReports,
  partnerReadiness,
  syncSummary,
  users,
}: TenantHealthInput): TenantHealthViewModel {
  const districts = distinctValues(clinics.map((clinic) => clinic.clinic.district));
  const organisations = distinctValues(
    users.map((user) =>
      user.organisationId ? `Organisation ${user.organisationId}` : null,
    ),
  );
  const coverage = summarizeReportingCoverage({
    clinicCount: clinics.length,
    staleClinicCount: syncSummary.staleClinics,
    needsConfirmationClinicCount: syncSummary.needsConfirmationClinics,
    pendingReviewCount: pendingReports.length,
    queuedOfflineCount: syncSummary.pendingOfflineReports,
    validationFailureCount: syncSummary.validationFailures,
  });
  const partnerReadinessModel = buildPartnerReadinessModel(partnerReadiness);
  const privilegedUsers = users.filter((user) =>
    ["org_admin", "system_admin"].includes(user.role),
  ).length;
  const accessRisks = accessRiskCount(users);
  const ingestionSignals =
    pendingReports.length +
    syncSummary.pendingOfflineReports +
    syncSummary.validationFailures +
    syncSummary.conflictsNeedingAttention +
    syncSummary.staleClinics +
    syncSummary.needsConfirmationClinics;
  const districtRows = buildDistrictRows(clinics, pendingReports);
  const partnerPressure = partnerReadinessModel.severity === "clear" ? 0 : 1;
  const estateTone = toneForReadiness(
    coverage.readinessPercent,
    ingestionSignals + accessRisks + partnerPressure,
  );
  const scope = [
    organisations.length ? organisations.join(", ") : "Current tenant estate",
    districts.length
      ? `${formatCount(districts.length)} districts`
      : "District scope unavailable",
  ].join(" / ");

  return {
    header: {
      eyebrow: "Platform operations",
      title: "Tenant health",
      description:
        "A tenant-wide health board for coverage, access, ingestion, and partner readiness across the active organisation.",
      score: {
        label: "Estate score",
        value: `${formatCount(coverage.readinessPercent)}%`,
        detail: coverage.blockers.length
          ? coverage.blockers.join("; ")
          : "All platform health gates are currently clear",
        tone: estateTone,
      },
      scope,
    },
    actions: [
      {
        label: "Review ingestion",
        href: "/admin/data-ingestion",
        icon: "stream",
        priority: "primary",
      },
      {
        label: "Audit access",
        href: "/admin/access-review",
        icon: "shield",
        priority: "secondary",
      },
      {
        label: "Partner readiness",
        href: "/admin/partner-readiness",
        icon: "plug",
        priority: "secondary",
      },
    ],
    metrics: [
      {
        label: "Tenant readiness",
        value: `${formatCount(coverage.readinessPercent)}%`,
        detail: coverage.blockers.length
          ? coverage.blockers.join("; ")
          : "No reporting coverage blockers",
        tone: coverage.tone,
      },
      {
        label: "District footprint",
        value: formatCount(districts.length),
        detail: `${formatCount(clinics.length)} operational clinics in scope`,
        tone: "info",
      },
      {
        label: "Open health signals",
        value: formatCount(ingestionSignals),
        detail: `${formatCount(pendingReports.length)} pending review; ${formatCount(
          syncSummary.pendingOfflineReports,
        )} offline queue`,
        tone: toneForPressure(ingestionSignals),
      },
      {
        label: "Access review load",
        value: formatCount(accessRisks),
        detail: `${formatCount(privilegedUsers)} privileged users in the estate`,
        tone: toneForPressure(accessRisks),
      },
    ],
    districtStack: {
      title: "District health stack",
      description:
        "District-level clinic coverage, freshness risk, and pending field evidence for the active tenant.",
      rows: districtRows,
    },
    signalLedger: {
      title: "Health signal ledger",
      description:
        "The platform signals that explain why the tenant is clear, under review, or blocked.",
      items: [
        {
          id: "coverage-freshness",
          label: "Coverage freshness",
          value: `${formatCount(
            syncSummary.staleClinics + syncSummary.needsConfirmationClinics,
          )} clinics`,
          detail: `${formatCount(syncSummary.staleClinics)} stale; ${formatCount(
            syncSummary.needsConfirmationClinics,
          )} need confirmation`,
          tone: toneForPressure(syncSummary.staleClinics + syncSummary.needsConfirmationClinics),
          href: "/admin/reporting-coverage",
          actionLabel: "Open coverage",
        },
        {
          id: "ingestion-queue",
          label: "Ingestion queue",
          value: `${formatCount(ingestionSignals)} signals`,
          detail: `${formatCount(pendingReports.length)} pending review; ${formatCount(
            syncSummary.validationFailures,
          )} validation failures; ${formatCount(
            syncSummary.conflictsNeedingAttention,
          )} conflicts`,
          tone: toneForPressure(ingestionSignals),
          href: "/admin/data-ingestion",
          actionLabel: "Review ingestion",
        },
        {
          id: "privileged-access",
          label: "Privileged access",
          value: `${formatCount(accessRisks)} flags`,
          detail: `${formatCount(privilegedUsers)} privileged users; ${formatCount(
            users.length,
          )} total access records`,
          tone: toneForPressure(accessRisks),
          href: "/admin/access-review",
          actionLabel: "Audit access",
        },
        {
          id: "partner-readiness",
          label: "Partner readiness",
          value: partnerReadinessModel.title,
          detail: partnerReadinessModel.description,
          tone: partnerReadinessModel.severity === "clear" ? "clear" : "attention",
          href: "/admin/partner-readiness",
          actionLabel: "Open partner",
        },
      ],
    },
    sourceReferences,
  };
}
