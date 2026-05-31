export type AdminReturnSource =
  | "admin"
  | "admin-reporting-coverage"
  | "admin-users-roles"
  | "admin-access-review"
  | "admin-audit-evidence"
  | "admin-integrations"
  | "admin-security"
  | "admin-api-contract"
  | "admin-export-schema";

export type AdminReturnTarget = {
  href: string;
  label: string;
};

const adminReturnTargets: Record<AdminReturnSource, AdminReturnTarget> = {
  admin: { href: "/admin", label: "Back to admin console" },
  "admin-reporting-coverage": {
    href: "/admin/reporting-coverage",
    label: "Back to reporting coverage",
  },
  "admin-users-roles": {
    href: "/admin/users-roles",
    label: "Back to users and roles",
  },
  "admin-access-review": {
    href: "/admin/access-review",
    label: "Back to access review",
  },
  "admin-audit-evidence": {
    href: "/admin/audit-evidence",
    label: "Back to audit evidence",
  },
  "admin-integrations": {
    href: "/admin/integrations",
    label: "Back to integrations",
  },
  "admin-security": {
    href: "/admin/security",
    label: "Back to security posture",
  },
  "admin-api-contract": {
    href: "/admin/api-contract",
    label: "Back to API contract",
  },
  "admin-export-schema": {
    href: "/admin/export-schema",
    label: "Back to export schema",
  },
};

export type AdminSearchParams = Record<string, string | string[] | undefined>;

export function getAdminReturnSource(searchParams?: AdminSearchParams) {
  const source = searchParams?.from;

  if (Array.isArray(source)) {
    return source[0];
  }

  return source;
}

export function getAdminReturnTarget(
  source?: string | null,
): AdminReturnTarget {
  if (source && source in adminReturnTargets) {
    return adminReturnTargets[source as AdminReturnSource];
  }

  return adminReturnTargets.admin;
}

export function parseAdminNumericId(value: string) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function appendReturnSource(path: string, source?: string) {
  if (!source) {
    return path;
  }

  const params = new URLSearchParams({ from: source });

  return `${path}?${params.toString()}`;
}

function encodeDetailId(value: number | string) {
  return encodeURIComponent(String(value));
}

export function buildAdminUserDetailHref(
  userId: number | string,
  source?: string,
) {
  return appendReturnSource(`/admin/users-roles/${encodeDetailId(userId)}`, source);
}

export function buildAdminAuditEventDetailHref(
  eventId: number | string,
  source?: string,
) {
  return appendReturnSource(
    `/admin/audit-evidence/events/${encodeDetailId(eventId)}`,
    source,
  );
}

export function buildAdminLeadDetailHref(
  leadId: number | string,
  source?: string,
) {
  return appendReturnSource(`/admin/leads/${encodeDetailId(leadId)}`, source);
}

export function buildAdminReportDetailHref(
  reportId: number | string,
  source?: string,
) {
  return appendReturnSource(`/admin/reports/${encodeDetailId(reportId)}`, source);
}

export function buildAdminApiKeyDetailHref(
  apiKeyId: number | string,
  source?: string,
) {
  return appendReturnSource(
    `/admin/integrations/api-keys/${encodeDetailId(apiKeyId)}`,
    source,
  );
}

export function buildAdminWebhookSubscriptionDetailHref(
  subscriptionId: number | string,
  source?: string,
) {
  return appendReturnSource(
    `/admin/integrations/webhook-subscriptions/${encodeDetailId(subscriptionId)}`,
    source,
  );
}

export function buildAdminWebhookEventDetailHref(
  eventId: number | string,
  source?: string,
) {
  return appendReturnSource(
    `/admin/integrations/webhook-events/${encodeDetailId(eventId)}`,
    source,
  );
}

export function buildAdminExportRunDetailHref(
  exportRunId: number | string,
  source?: string,
) {
  return appendReturnSource(
    `/admin/integrations/export-runs/${encodeDetailId(exportRunId)}`,
    source,
  );
}

export function buildAdminIntegrationCheckDetailHref(
  checkId: number | string,
  source?: string,
) {
  return appendReturnSource(
    `/admin/integrations/checks/${encodeDetailId(checkId)}`,
    source,
  );
}
