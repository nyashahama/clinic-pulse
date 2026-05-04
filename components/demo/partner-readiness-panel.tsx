"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileJson,
  KeyRound,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { SectionHeader } from "@/components/demo/section-header";
import { Button } from "@/components/ui/button";
import type { PartnerReadinessApiResponse } from "@/lib/demo/api-types";
import {
  buildPartnerReadinessModel,
  isPartnerApiKeyActive,
  type OneTimePartnerApiKeySecret,
  type OneTimePartnerWebhookSecret,
  type PartnerReadinessMetric,
  type PartnerReadinessSeverity,
} from "@/lib/demo/partner-readiness";
import { cn } from "@/lib/utils";

type PartnerReadinessPanelProps = {
  readiness: PartnerReadinessApiResponse;
  onCreateDemoKey: () => void;
  onCreateWebhook?: () => void;
  onGenerateExport: () => void;
  onTestWebhook?: (subscriptionId: number) => void;
  pendingActions?: {
    createDemoKey?: boolean;
    createWebhook?: boolean;
    generateExport?: boolean;
    testWebhook?: boolean;
  };
  actionError?: string | null;
  oneTimeApiKeySecret?: OneTimePartnerApiKeySecret | null;
  oneTimeWebhookSecret?: OneTimePartnerWebhookSecret | null;
  onClearOneTimeApiKeySecret?: () => void;
  onClearOneTimeWebhookSecret?: () => void;
};

type Tone = PartnerReadinessSeverity | "info";

const numberFormatter = new Intl.NumberFormat("en-ZA");

const toneClassNames: Record<Tone, string> = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  watch:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  attention:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
  info:
    "border-border-subtle bg-bg-subtle text-content-default dark:border-border-subtle dark:bg-bg-subtle dark:text-content-default",
};

const metricToneClassNames: Record<PartnerReadinessMetric["tone"], string> = {
  clear: "text-emerald-700 dark:text-emerald-300",
  watch: "text-amber-700 dark:text-amber-200",
  attention: "text-rose-700 dark:text-rose-300",
  info: "text-content-emphasis",
};

const severityIcons: Record<PartnerReadinessSeverity, typeof CheckCircle2> = {
  clear: CheckCircle2,
  watch: ShieldCheck,
  attention: AlertTriangle,
};

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatCheckName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusTone(status: string): Tone {
  const normalized = status.trim().toLowerCase();
  if (normalized === "passing" || normalized === "active" || normalized === "delivered") {
    return "clear";
  }
  if (normalized === "attention" || normalized === "queued" || normalized === "preview_only") {
    return "watch";
  }
  if (normalized === "failing" || normalized === "disabled" || normalized === "failed") {
    return "attention";
  }
  return "info";
}

function isActiveWebhookStatus(status: string) {
  return status.trim().toLowerCase() === "active";
}

function Badge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: Tone;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        toneClassNames[tone],
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: PartnerReadinessSeverity }) {
  const Icon = severityIcons[severity];

  return (
    <Badge
      label={severity}
      tone={severity}
      icon={<Icon aria-hidden="true" className="size-3.5 shrink-0" />}
    />
  );
}

function StateRow({
  icon: Icon,
  title,
  status,
  detail,
  tone,
  action,
}: {
  icon: typeof KeyRound;
  title: string;
  status: string;
  detail: string;
  tone: Tone;
  action?: ReactNode;
}) {
  return (
    <div className="grid gap-3 border-t border-border-subtle pt-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-subtle text-content-subtle">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-content-emphasis">{title}</p>
            <Badge label={status} tone={tone} />
          </div>
          <p className="mt-1 break-words text-sm text-content-subtle">{detail}</p>
        </div>
      </div>
      {action ? <div className="flex md:justify-end">{action}</div> : null}
    </div>
  );
}

function OneTimeSecretNotice({
  title,
  detail,
  secret,
  onClear,
}: {
  title: string;
  detail: string;
  secret: string;
  onClear?: () => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 break-words text-xs text-amber-900/80 dark:text-amber-100/80">
            {detail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(secret).catch(() => undefined);
            }}
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
          {onClear ? (
            <Button type="button" size="sm" variant="outline" onClick={onClear}>
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>
      <code className="mt-3 block max-w-full overflow-x-auto rounded bg-bg-default px-3 py-2 text-xs font-semibold text-content-emphasis">
        {secret}
      </code>
    </div>
  );
}

export function PartnerReadinessPanel({
  readiness,
  onCreateDemoKey,
  onCreateWebhook,
  onGenerateExport,
  onTestWebhook,
  pendingActions,
  actionError,
  oneTimeApiKeySecret,
  oneTimeWebhookSecret,
  onClearOneTimeApiKeySecret,
  onClearOneTimeWebhookSecret,
}: PartnerReadinessPanelProps) {
  const model = buildPartnerReadinessModel(readiness);
  const activeApiKeys = readiness.apiKeys.filter((apiKey) =>
    isPartnerApiKeyActive(apiKey),
  );
  const latestApiKey = [...activeApiKeys].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
  const latestExport = [...readiness.exportRuns].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
  const activeSubscriptions = readiness.webhookSubscriptions.filter(
    (subscription) => isActiveWebhookStatus(subscription.status),
  );
  const webhookSubscription = activeSubscriptions[0] ?? readiness.webhookSubscriptions[0];
  const latestWebhookEvent = [...readiness.webhookEvents].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];
  const apiKeyStatus =
    activeApiKeys.length > 0 ? `${formatCount(activeApiKeys.length)} active` : "No active key";
  const exportStatus = latestExport ? `${latestExport.format.toUpperCase()} export` : "No export";
  const webhookStatus = webhookSubscription
    ? formatStatusLabel(webhookSubscription.status)
    : "No subscription";
  const selectedWebhookIsActive = webhookSubscription
    ? isActiveWebhookStatus(webhookSubscription.status)
    : false;
  const webhookTestDisabled =
    !selectedWebhookIsActive || !onTestWebhook || pendingActions?.testWebhook;
  const webhookCreateDisabled = !onCreateWebhook || pendingActions?.createWebhook;

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Partner readiness"
        title={model.title}
        description={model.description}
        actions={<SeverityBadge severity={model.severity} />}
      />

      {actionError ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{actionError}</span>
        </div>
      ) : null}

      {oneTimeApiKeySecret ? (
        <OneTimeSecretNotice
          title="One-time API key secret"
          detail={`${oneTimeApiKeySecret.name} / ${oneTimeApiKeySecret.keyPrefix}`}
          secret={oneTimeApiKeySecret.secret}
          onClear={onClearOneTimeApiKeySecret}
        />
      ) : null}

      {oneTimeWebhookSecret ? (
        <OneTimeSecretNotice
          title="One-time webhook secret"
          detail={`${oneTimeWebhookSecret.name} / ${oneTimeWebhookSecret.targetUrl}`}
          secret={oneTimeWebhookSecret.secret}
          onClear={onClearOneTimeWebhookSecret}
        />
      ) : null}

      <dl className="mt-4 grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {model.metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 border-t border-border-subtle pt-3"
          >
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              {metric.label}
            </dt>
            <dd
              className={cn(
                "mt-1 break-words text-2xl font-semibold leading-tight tabular-nums",
                metricToneClassNames[metric.tone],
              )}
            >
              {metric.value}
            </dd>
            {metric.detail ? (
              <dd className="mt-1 break-words text-xs text-content-subtle">
                {metric.detail}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-3">
        <StateRow
          icon={KeyRound}
          title="API key state"
          status={apiKeyStatus}
          tone={activeApiKeys.length > 0 ? "clear" : "attention"}
          detail={
            latestApiKey
              ? `${latestApiKey.keyPrefix} / ${formatCount(latestApiKey.scopes.length)} scopes`
              : `${formatCount(readiness.apiKeys.length)} total keys`
          }
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pendingActions?.createDemoKey}
              onClick={onCreateDemoKey}
            >
              <KeyRound className="size-3.5" />
              Create key
            </Button>
          }
        />

        <StateRow
          icon={FileJson}
          title="Export package state"
          status={exportStatus}
          tone={latestExport ? "clear" : "attention"}
          detail={
            latestExport
              ? `${latestExport.checksum.slice(0, 20)} / ${formatDate(latestExport.createdAt)}`
              : `${formatCount(readiness.exportRuns.length)} generated`
          }
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pendingActions?.generateExport}
              onClick={onGenerateExport}
            >
              <FileJson className="size-3.5" />
              Generate export
            </Button>
          }
        />

        <StateRow
          icon={Webhook}
          title="Webhook preview state"
          status={webhookStatus}
          tone={webhookSubscription ? getStatusTone(webhookSubscription.status) : "watch"}
          detail={
            latestWebhookEvent
              ? `${latestWebhookEvent.eventType} / ${formatStatusLabel(
                  latestWebhookEvent.status,
                )} / ${formatDate(latestWebhookEvent.createdAt)}`
              : `${formatCount(readiness.webhookEvents.length)} preview events`
          }
          action={
            selectedWebhookIsActive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={webhookTestDisabled}
                onClick={() => {
                  if (webhookSubscription && onTestWebhook) {
                    onTestWebhook(webhookSubscription.id);
                  }
                }}
              >
                <PlayCircle className="size-3.5" />
                Test webhook
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={webhookCreateDisabled}
                onClick={onCreateWebhook}
              >
                <Webhook className="size-3.5" />
                Create webhook
              </Button>
            )
          }
        />
      </div>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ListChecks aria-hidden="true" className="size-4 shrink-0 text-content-subtle" />
            <h3 className="text-sm font-semibold text-content-emphasis">
              Integration checks
            </h3>
          </div>
          <span className="text-xs font-medium text-content-subtle">
            {formatCount(readiness.integrationChecks.length)} reported
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-md border border-border-subtle">
          {readiness.integrationChecks.length > 0 ? (
            readiness.integrationChecks.map((check) => (
              <div
                key={`${check.checkName}-${check.checkedAt}`}
                className="grid gap-2 border-b border-border-subtle px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-content-emphasis">
                    {formatCheckName(check.checkName)}
                  </p>
                  <p className="mt-1 break-words text-xs text-content-subtle">
                    {check.summary}
                  </p>
                </div>
                <Badge
                  label={formatStatusLabel(check.status)}
                  tone={getStatusTone(check.status)}
                />
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-content-subtle">
              No checks reported
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
