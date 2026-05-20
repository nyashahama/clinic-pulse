import { notFound } from "next/navigation";

import {
  AdminDetailFieldGrid,
  AdminDetailJsonBlock,
  AdminDetailShell,
  formatAdminDetailRecord,
} from "@/components/product/admin-detail";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { requireDemoWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminGovernanceData } from "../../../admin-loaders";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../../governance-formatters";

type ExportRunDetailPageProps = {
  params: Promise<{
    exportRunId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

export default async function Page({
  params,
  searchParams,
}: ExportRunDetailPageProps) {
  await requireDemoWorkflowAccess("admin");

  const [{ exportRunId }, query, data] = await Promise.all([
    params,
    searchParams,
    loadAdminGovernanceData(),
  ]);
  const parsedExportRunId = parseAdminNumericId(exportRunId);

  if (!parsedExportRunId) {
    notFound();
  }

  const exportRun = data.partnerReadiness.exportRuns.find(
    (row) => row.id === parsedExportRunId,
  );

  if (!exportRun) {
    notFound();
  }

  const requester = exportRun.requestedByUserId
    ? data.users.find((user) => user.userId === exportRun.requestedByUserId)
    : undefined;
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Partner operations"
      title="Export run detail"
      description={exportRun.checksum}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Format",
            value: <StatusBadge tone="info">{formatLabel(exportRun.format)}</StatusBadge>,
          },
          {
            label: "Checksum",
            value: (
              <span className="break-all font-mono text-xs">
                {exportRun.checksum}
              </span>
            ),
            className: "sm:col-span-2",
          },
          {
            label: "Record counts",
            value: formatAdminDetailRecord(exportRun.recordCounts),
            className: "sm:col-span-2",
          },
          {
            label: "Scope",
            value: formatAdminDetailRecord(exportRun.scope),
            className: "sm:col-span-2",
          },
          {
            label: "Requested by",
            value: requester
              ? `${requester.displayName} (${requester.email})`
              : exportRun.requestedByUserId
                ? `User ${exportRun.requestedByUserId}`
                : "Unavailable",
          },
          {
            label: "Created",
            value: formatDateTime(exportRun.createdAt),
          },
        ]}
      />
      <AdminDetailJsonBlock title="Export payload" value={exportRun.payload} />
    </AdminDetailShell>
  );
}
