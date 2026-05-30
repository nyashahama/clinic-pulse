import { notFound } from "next/navigation";

import {
  AdminDetailFieldGrid,
  AdminDetailShell,
  formatAdminDetailList,
} from "@/components/product/admin-detail";
import { isPartnerApiKeyActive } from "@/lib/workspace/partner-readiness";
import {
  getAdminReturnSource,
  getAdminReturnTarget,
  parseAdminNumericId,
  type AdminSearchParams,
} from "@/lib/product/admin-detail-routes";
import { requireWorkspaceWorkflowAccess } from "../../../../workflow-guard";
import { loadAdminPartnerReadiness } from "../../../admin-loaders";
import {
  formatDateTime,
  formatLabel,
  StatusBadge,
} from "../../../governance-formatters";

type ApiKeyDetailPageProps = {
  params: Promise<{
    apiKeyId: string;
  }>;
  searchParams: Promise<AdminSearchParams>;
};

function apiKeyState({
  revokedAt,
  expiresAt,
}: {
  revokedAt?: string | null;
  expiresAt?: string | null;
}) {
  if (revokedAt) {
    return { label: "Revoked", tone: "blocked" as const };
  }

  if (expiresAt) {
    const expiry = new Date(expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now()) {
      return { label: "Expired", tone: "attention" as const };
    }
  }

  return { label: "Active", tone: "clear" as const };
}

export default async function Page({
  params,
  searchParams,
}: ApiKeyDetailPageProps) {
  await requireWorkspaceWorkflowAccess("admin");

  const [{ apiKeyId }, query, readiness] = await Promise.all([
    params,
    searchParams,
    loadAdminPartnerReadiness(),
  ]);
  const parsedApiKeyId = parseAdminNumericId(apiKeyId);

  if (!parsedApiKeyId) {
    notFound();
  }

  const apiKey = readiness.apiKeys.find((row) => row.id === parsedApiKeyId);

  if (!apiKey) {
    notFound();
  }

  const state = apiKeyState(apiKey);
  const active = isPartnerApiKeyActive(apiKey);
  const returnTarget = getAdminReturnTarget(getAdminReturnSource(query));

  return (
    <AdminDetailShell
      eyebrow="Partner operations"
      title="API key detail"
      description={`${apiKey.name} / ${apiKey.keyPrefix}`}
      returnHref={returnTarget.href}
      returnLabel={returnTarget.label}
    >
      <AdminDetailFieldGrid
        fields={[
          {
            label: "Credential",
            value: (
              <div>
                <p>{apiKey.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {apiKey.keyPrefix}
                </p>
              </div>
            ),
          },
          {
            label: "State",
            value: <StatusBadge tone={state.tone}>{state.label}</StatusBadge>,
          },
          {
            label: "Runtime active",
            value: (
              <StatusBadge tone={active ? "clear" : "attention"}>
                {active ? "Active" : "Inactive"}
              </StatusBadge>
            ),
          },
          {
            label: "Environment",
            value: formatLabel(apiKey.environment),
          },
          {
            label: "Scopes",
            value: formatAdminDetailList(apiKey.scopes.map(formatLabel)),
            className: "sm:col-span-2",
          },
          {
            label: "Allowed districts",
            value: formatAdminDetailList(apiKey.allowedDistricts),
            className: "sm:col-span-2",
          },
          {
            label: "Last used",
            value: formatDateTime(apiKey.lastUsedAt),
          },
          {
            label: "Last used IP",
            value: apiKey.lastUsedIp ?? "Unavailable",
          },
          {
            label: "Created",
            value: formatDateTime(apiKey.createdAt),
          },
          {
            label: "Updated",
            value: formatDateTime(apiKey.updatedAt),
          },
          {
            label: "Expires",
            value: formatDateTime(apiKey.expiresAt),
          },
          {
            label: "Revoked",
            value: formatDateTime(apiKey.revokedAt),
          },
        ]}
      />
    </AdminDetailShell>
  );
}
