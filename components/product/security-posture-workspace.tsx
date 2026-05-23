"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  FileSearchIcon,
  KeyRoundIcon,
  RadioTowerIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from "lucide-react";

import { AdminStatusBadge, type AdminTone } from "@/components/product/admin-module";
import {
  AuditModeTab,
  DarkFact,
  EmptyEvidence,
  ExposureNodeCard,
  LaneTab,
  SectionHeader,
  SignalPill,
  railToneClassName,
  surfaceToneClassName,
  type ExposureNode,
} from "@/components/product/security-posture-primitives";
import { cn } from "@/lib/utils";

export type SecuritySummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
};

export type SecurityFinding = {
  id: string;
  title: string;
  summary: string;
  tone: AdminTone;
  countLabel: string;
  detailLabel: string;
  primaryEvidence: string;
  secondaryEvidence: string;
  remediation: string;
  evidenceHref?: string;
  evidenceLabel?: string;
};

export type SecurityCredentialRow = {
  id: string;
  href: string;
  name: string;
  prefix: string;
  stateLabel: string;
  stateTone: AdminTone;
  environmentLabel: string;
  scopeLabel: string;
  allowedDistrictsLabel: string;
  lastUsedLabel: string;
  expiryLabel: string;
};

export type SecurityAccessRow = {
  id: string;
  href: string;
  displayName: string;
  email: string;
  roleLabel: string;
  scopeLabel: string;
  lastSeenLabel: string;
  tone: AdminTone;
};

export type SecurityWebhookRow = {
  id: string;
  href: string;
  ariaLabel: string;
  typeLabel: string;
  name: string;
  stateLabel: string;
  tone: AdminTone;
  targetLabel: string;
  evidence: string;
  observedLabel: string;
};

export type SecurityAuditRow = {
  id: string;
  href: string;
  eventLabel: string;
  actorLabel: string;
  roleLabel: string;
  entityLabel: string;
  summary: string;
  createdLabel: string;
};

type SecurityPostureWorkspaceProps = {
  metrics: SecuritySummaryMetric[];
  findings: SecurityFinding[];
  credentialRows: SecurityCredentialRow[];
  privilegedAccessRows: SecurityAccessRow[];
  webhookEvidenceRows: SecurityWebhookRow[];
  accessAuditRows: SecurityAuditRow[];
};

type TimelineItem = {
  id: string;
  href: string;
  label: string;
  title: string;
  detail: string;
  timestamp: string;
  tone: AdminTone;
  ariaLabel: string;
};

type AuditGroup = SecurityAuditRow & {
  count: number;
};

const lanePanelId = "security-control-lane-panel";
const auditPanelId = "security-audit-review-panel";

export function SecurityPostureWorkspace({
  metrics,
  findings,
  credentialRows,
  privilegedAccessRows,
  webhookEvidenceRows,
  accessAuditRows,
}: SecurityPostureWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(findings[0]?.id ?? null);
  const [activeLaneId, setActiveLaneId] = useState("all");
  const [auditMode, setAuditMode] = useState<"grouped" | "occurrences">("grouped");
  const selectedFinding = useMemo(
    () => findings.find((finding) => finding.id === selectedId) ?? findings[0] ?? null,
    [findings, selectedId],
  );
  const activeFindings = useMemo(
    () => (activeLaneId === "all" ? findings : findings.filter((finding) => finding.id === activeLaneId)),
    [activeLaneId, findings],
  );
  const advisorMetric = metrics.find((metric) => metric.id === "advisor-findings");
  const postureSignalCount =
    advisorMetric?.value ?? String(findings.filter((finding) => finding.tone !== "clear").length);
  const exposureNodes = useMemo<ExposureNode[]>(
    () => [
      {
        id: "credentials",
        label: "Credential boundary",
        count: String(credentialRows.length),
        detail: "Partner API keys and scoped access",
        evidence: credentialRows[0]
          ? `${credentialRows[0].name} / ${credentialRows[0].stateLabel}`
          : "No credential evidence",
        href: credentialRows[0]?.href,
        tone: credentialRows.some((row) => row.stateTone !== "clear") ? "attention" : "clear",
        icon: <KeyRoundIcon className="size-4" aria-hidden="true" />,
      },
      {
        id: "identity",
        label: "Identity boundary",
        count: String(privilegedAccessRows.length),
        detail: "Elevated users and access scope",
        evidence: privilegedAccessRows[0]
          ? `${privilegedAccessRows[0].displayName} / ${privilegedAccessRows[0].roleLabel}`
          : "No privileged access evidence",
        href: privilegedAccessRows[0]?.href,
        tone: privilegedAccessRows.length ? "attention" : "clear",
        icon: <UserCogIcon className="size-4" aria-hidden="true" />,
      },
      {
        id: "delivery",
        label: "Delivery boundary",
        count: String(webhookEvidenceRows.length),
        detail: "Webhook subscriptions and attempts",
        evidence: webhookEvidenceRows[0]
          ? `${webhookEvidenceRows[0].name} / ${webhookEvidenceRows[0].stateLabel}`
          : "No webhook evidence",
        href: webhookEvidenceRows[0]?.href,
        tone: webhookEvidenceRows.some((row) => row.tone !== "clear") ? "attention" : "clear",
        icon: <RadioTowerIcon className="size-4" aria-hidden="true" />,
      },
      {
        id: "audit",
        label: "Audit boundary",
        count: String(accessAuditRows.length),
        detail: "Actor, entity, and timestamp trail",
        evidence: accessAuditRows[0]
          ? `${accessAuditRows[0].eventLabel} / ${accessAuditRows[0].actorLabel}`
          : "No audit events",
        href: accessAuditRows[0]?.href,
        tone: accessAuditRows.length ? "info" : "attention",
        icon: <ActivityIcon className="size-4" aria-hidden="true" />,
      },
    ],
    [accessAuditRows, credentialRows, privilegedAccessRows, webhookEvidenceRows],
  );
  const timelineItems = useMemo<TimelineItem[]>(
    () => [
      ...webhookEvidenceRows.slice(0, 4).map((row) => ({
        id: `webhook-${row.id}`,
        href: row.href,
        label: row.typeLabel,
        title: row.name,
        detail: row.evidence,
        timestamp: row.observedLabel,
        tone: row.tone,
        ariaLabel: row.ariaLabel,
      })),
      ...accessAuditRows.slice(0, 6).map((row) => ({
        id: `audit-${row.id}`,
        href: row.href,
        label: row.eventLabel,
        title: row.actorLabel,
        detail: row.summary,
        timestamp: row.createdLabel,
        tone: "info" as AdminTone,
        ariaLabel: `Open audit event ${row.id} detail`,
      })),
    ].slice(0, 8),
    [accessAuditRows, webhookEvidenceRows],
  );
  const auditGroups = useMemo<AuditGroup[]>(() => {
    const grouped = new Map<string, AuditGroup>();

    for (const row of accessAuditRows) {
      const key = [row.eventLabel, row.actorLabel, row.roleLabel, row.summary].join("::");
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
        continue;
      }

      grouped.set(key, { ...row, count: 1 });
    }

    return Array.from(grouped.values()).slice(0, 12);
  }, [accessAuditRows]);
  const occurrenceAuditRows = useMemo<AuditGroup[]>(
    () => accessAuditRows.slice(0, 12).map((row) => ({ ...row, count: 1 })),
    [accessAuditRows],
  );
  const visibleAuditRows = auditMode === "grouped" ? auditGroups : occurrenceAuditRows;

  return (
    <section aria-label="Security posture workspace" className="grid gap-4">
      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.18),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(245,158,11,0.2),transparent_24%),linear-gradient(135deg,#fbfffc_0%,#f4faf8_48%,#fff8eb_100%)] text-content-default shadow-sm">
        <div className="grid gap-4 border-b border-border-subtle/80 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
              Security review
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              Security evidence review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-5 text-muted-foreground">
              Review credential, webhook, privileged access, and audit evidence before opening source records.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-[28rem] lg:max-w-[34rem]">
            {metrics.map((metric) => (
              <SignalPill
                key={metric.id}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.48fr)]">
          <section
            aria-label="Security exposure map"
            className="relative flex min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-default/80 p-4 shadow-sm backdrop-blur"
          >
            <div className="absolute inset-x-10 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent lg:block" aria-hidden="true" />
            <div className="absolute inset-y-10 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent lg:block" aria-hidden="true" />
            <div className="relative grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_minmax(0,1fr)] lg:items-center">
              <div className="grid gap-3">
                {exposureNodes.slice(0, 2).map((node) => (
                  <ExposureNodeCard key={node.id} node={node} />
                ))}
              </div>

              <div className="relative mx-auto flex aspect-square w-full max-w-60 items-center justify-center rounded-full border border-teal-200 bg-gradient-to-br from-teal-950 via-teal-900 to-stone-950 p-5 text-white shadow-[0_24px_80px_rgba(15,118,110,0.26)]">
                <div className="absolute inset-4 rounded-full border border-white/10" aria-hidden="true" />
                <div className="absolute inset-9 rounded-full border border-dashed border-white/20" aria-hidden="true" />
                <div className="relative text-center">
                  <ShieldAlertIcon className="mx-auto size-8 text-amber-200" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
                    Evidence map
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                    {postureSignalCount}
                  </p>
                  <p className="mt-1 text-xs text-teal-100/80">
                    findings to review
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {exposureNodes.slice(2).map((node) => (
                  <ExposureNodeCard key={node.id} node={node} />
                ))}
              </div>
            </div>
            <div className="relative mt-4 grid gap-2 rounded-2xl border border-border-subtle bg-bg-default/75 p-3 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
              <p>
                <span className="block font-semibold uppercase tracking-[0.12em] text-foreground">Source evidence</span>
                Credentials, webhooks, users, and audit rows stay linked to their source evidence.
              </p>
              <p>
                <span className="block font-semibold uppercase tracking-[0.12em] text-foreground">Read-only mode</span>
                Rotation, retry, and incident handoff controls remain outside this review surface.
              </p>
              <p>
                <span className="block font-semibold uppercase tracking-[0.12em] text-foreground">Detail handoff</span>
                The selected review area decides which source record opens next.
              </p>
            </div>
          </section>

          <aside
            aria-label="Security evidence dossier"
            className="overflow-hidden rounded-2xl border border-stone-300 bg-stone-950 text-stone-50 shadow-[0_24px_70px_rgba(28,25,23,0.22)]"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                Evidence detail
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                Selected finding
              </h3>
            </div>
            {selectedFinding ? (
              <div className="grid gap-3 p-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-amber-200">
                      <FileSearchIcon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-lg font-semibold">{selectedFinding.title}</p>
                      <p className="mt-1 break-words text-sm leading-5 text-stone-300">
                        {selectedFinding.primaryEvidence}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DarkFact label="Source">
                    <div className="grid gap-2">
                      <AdminStatusBadge tone={selectedFinding.tone}>{selectedFinding.countLabel}</AdminStatusBadge>
                      <span className="text-stone-300">{selectedFinding.detailLabel}</span>
                    </div>
                  </DarkFact>
                  <DarkFact label="Evidence basis">{selectedFinding.secondaryEvidence}</DarkFact>
                </div>

                <DarkFact label="Review state">
                  {selectedFinding.tone === "clear"
                    ? "No immediate risk acceptance is required for this review area."
                    : "Review before promotion; treat this as under review until source evidence is resolved."}
                </DarkFact>

                <DarkFact label="Next step">{selectedFinding.remediation}</DarkFact>

                {selectedFinding.evidenceHref ? (
                  <Link
                    href={selectedFinding.evidenceHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                  >
                    {selectedFinding.evidenceLabel ?? "Open source evidence"}
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="p-4 text-sm text-stone-300">No security findings are available.</div>
            )}
          </aside>
        </div>
      </section>

      <section
        aria-label="Security review areas"
        className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <SectionHeader
          icon={<ShieldCheckIcon className="size-4" aria-hidden="true" />}
          eyebrow="Security review"
          title="Review areas"
          description="Choose a security area, then inspect the linked evidence rows below."
        />
        <div
          aria-label="Security lane filters"
          role="tablist"
          className="flex gap-0 overflow-x-auto border-b border-border-subtle bg-bg-muted/30 px-3 pt-3"
        >
          <LaneTab
            isActive={activeLaneId === "all"}
            label="All lanes"
            count={findings.length}
            controls={lanePanelId}
            onClick={() => setActiveLaneId("all")}
          />
          {findings.map((finding) => (
            <LaneTab
              key={finding.id}
              isActive={activeLaneId === finding.id}
              label={finding.title}
              count={1}
              controls={lanePanelId}
              onClick={() => {
                setActiveLaneId(finding.id);
                setSelectedId(finding.id);
              }}
            />
          ))}
        </div>
        <div
          id={lanePanelId}
          role="tabpanel"
          aria-label="Security advisor findings"
          className="grid gap-3 p-3 lg:grid-cols-2 xl:grid-cols-4"
        >
          {activeFindings.map((finding) => {
            const isSelected = selectedFinding?.id === finding.id;

            return (
              <article
                key={finding.id}
                className={cn(
                  "group flex min-h-52 flex-col justify-between overflow-hidden rounded-2xl border bg-bg-default transition",
                  isSelected
                    ? "border-amber-300 shadow-[0_18px_46px_rgba(245,158,11,0.16)]"
                    : "border-border-subtle hover:border-teal-200 hover:shadow-sm",
                )}
              >
                <div className={cn("h-1", railToneClassName[finding.tone])} aria-hidden="true" />
                <div className="grid gap-3 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <AdminStatusBadge tone={finding.tone}>{finding.countLabel}</AdminStatusBadge>
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-xl border",
                        surfaceToneClassName[finding.tone],
                      )}
                      aria-hidden="true"
                    >
                      <ShieldAlertIcon className="size-4" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-foreground">{finding.title}</p>
                    <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
                      {finding.summary}
                    </p>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                    {finding.detailLabel}
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Inspect security finding ${finding.title}`}
                  className={cn(
                    "m-3 mt-0 inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition",
                    isSelected
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "border border-border-subtle bg-bg-default text-foreground hover:bg-bg-muted",
                  )}
                  onClick={() => setSelectedId(finding.id)}
                >
                  Inspect finding
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <section
          aria-label="Credential exposure ledger"
          className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <SectionHeader
            icon={<KeyRoundIcon className="size-4" aria-hidden="true" />}
            eyebrow="Credential boundary"
            title="Credential exposure ledger"
            description="API keys stay reviewable without exposing secrets. Scope, state, and expiry are visible before opening detail records."
          />
          <div className="grid gap-2 p-3">
            {credentialRows.length ? (
              credentialRows.map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  aria-label={`Open ${row.name} API key detail`}
                  className="grid min-w-0 gap-3 rounded-2xl border border-border-subtle bg-bg-default p-3 transition hover:bg-bg-muted/60"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-foreground">{row.name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {row.prefix}
                      </p>
                    </div>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <AdminStatusBadge tone={row.stateTone}>{row.stateLabel}</AdminStatusBadge>
                    <AdminStatusBadge tone="info">{row.environmentLabel}</AdminStatusBadge>
                  </div>
                  <p className="break-words text-xs leading-5 text-muted-foreground">
                    {row.scopeLabel} / {row.allowedDistrictsLabel}
                  </p>
                  <p className="break-words text-xs leading-5 text-muted-foreground">
                    Last used {row.lastUsedLabel}; {row.expiryLabel}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyEvidence message="No partner API key evidence is recorded." />
            )}
          </div>
        </section>

        <section
          aria-label="Privileged access evidence"
          className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <SectionHeader
            icon={<UserCogIcon className="size-4" aria-hidden="true" />}
            eyebrow="Identity boundary"
            title="Privileged access evidence"
            description="Elevated platform users are treated as exposure records instead of ordinary user rows."
          />
          <div className="grid gap-2 p-3 md:grid-cols-2">
            {privilegedAccessRows.length ? (
              privilegedAccessRows.map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  aria-label={`Open ${row.displayName} user detail`}
                  className="grid min-w-0 gap-3 rounded-2xl border border-border-subtle bg-bg-default p-3 transition hover:bg-bg-muted/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <AdminStatusBadge tone={row.tone}>{row.roleLabel}</AdminStatusBadge>
                    <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-foreground">{row.displayName}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{row.email}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {row.scopeLabel} / last seen {row.lastSeenLabel}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyEvidence message="No privileged access evidence is recorded." />
            )}
          </div>
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section
          aria-label="Webhook delivery evidence"
          className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <SectionHeader
            icon={<RadioTowerIcon className="size-4" aria-hidden="true" />}
            eyebrow="Delivery boundary"
            title="Webhook delivery evidence"
            description="Subscription tests and delivery attempts form the transport-security lane."
          />
          <div className="grid max-h-[30rem] gap-2 overflow-auto p-3">
            {webhookEvidenceRows.length ? (
              webhookEvidenceRows.map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  aria-label={row.ariaLabel}
                  className="grid min-w-0 gap-3 rounded-2xl border border-border-subtle bg-bg-default p-3 transition hover:bg-bg-muted/60 md:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      <AdminStatusBadge tone={row.tone}>{row.typeLabel}</AdminStatusBadge>
                      <AdminStatusBadge tone={row.tone}>{row.stateLabel}</AdminStatusBadge>
                    </div>
                    <p className="mt-2 break-words font-semibold text-foreground">{row.name}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{row.targetLabel}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm text-foreground">{row.evidence}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Observed {row.observedLabel}</p>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyEvidence message="No webhook delivery evidence is recorded." />
            )}
          </div>
        </section>

        <section
          aria-label="Security event timeline"
          className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
        >
          <SectionHeader
            icon={<ActivityIcon className="size-4" aria-hidden="true" />}
            eyebrow="Event stream"
            title="Security timeline"
            description="A compact chronology of transport and access events for quick investigation context."
          />
          <div className="grid gap-0 p-3">
            {timelineItems.length ? (
              timelineItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-label={item.ariaLabel}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-2xl p-2 transition hover:bg-bg-muted/60"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-full border",
                        surfaceToneClassName[item.tone],
                      )}
                      aria-hidden="true"
                    >
                      <ActivityIcon className="size-4" />
                    </span>
                    {index < timelineItems.length - 1 ? (
                      <span className="my-1 h-8 w-px bg-border-subtle" aria-hidden="true" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone={item.tone}>{item.label}</AdminStatusBadge>
                      <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                    </div>
                    <p className="mt-1 break-words font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <ArrowRightIcon className="mt-2 size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))
            ) : (
              <EmptyEvidence message="No security timeline events are recorded." />
            )}
          </div>
        </section>
      </div>

      <section
        aria-label="Access audit trail"
        className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-default text-content-default shadow-sm"
      >
        <SectionHeader
          icon={<ActivityIcon className="size-4" aria-hidden="true" />}
          eyebrow="Audit boundary"
          title="Access audit trail"
          description="Access-related events remain linked to their original audit evidence."
        />
        <div
          aria-label="Audit review mode"
          role="tablist"
          className="flex flex-wrap gap-2 border-b border-border-subtle bg-bg-muted/30 px-4 py-3"
        >
          <AuditModeTab
            isActive={auditMode === "grouped"}
            label="Grouped audit review"
            count={auditGroups.length}
            controls={auditPanelId}
            onClick={() => setAuditMode("grouped")}
          />
          <AuditModeTab
            isActive={auditMode === "occurrences"}
            label="Occurrence stream"
            count={Math.min(accessAuditRows.length, 12)}
            controls={auditPanelId}
            onClick={() => setAuditMode("occurrences")}
          />
        </div>
        {accessAuditRows.length ? (
          <div className="border-b border-border-subtle bg-bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            Showing {visibleAuditRows.length} {auditMode === "grouped" ? "grouped" : "occurrence"} audit records from {accessAuditRows.length} linked access events.
          </div>
        ) : null}
        <div id={auditPanelId} role="tabpanel" className="grid gap-2 p-3">
          {visibleAuditRows.length ? (
            visibleAuditRows.map((row) => (
              <Link
                key={row.id}
                href={row.href}
                aria-label={`Open audit event ${row.id} detail`}
                className="grid min-w-0 gap-3 rounded-2xl border border-border-subtle bg-bg-default p-3 transition hover:bg-bg-muted/60 md:grid-cols-[minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <AdminStatusBadge tone="info">{row.eventLabel}</AdminStatusBadge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.count} event{row.count === 1 ? "" : "s"} / latest {row.createdLabel}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground">{row.actorLabel}</p>
                  <p className="text-xs text-muted-foreground">{row.roleLabel}</p>
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm text-foreground">{row.summary}</p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{row.entityLabel}</p>
                </div>
                <ArrowRightIcon className="size-4 self-center text-muted-foreground" aria-hidden="true" />
              </Link>
            ))
          ) : (
            <EmptyEvidence message="No access audit evidence is recorded in the current window." />
          )}
        </div>
      </section>
    </section>
  );
}
