"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminTone } from "@/components/product/admin-module";
import { cn } from "@/lib/utils";

export type ExposureNode = {
  id: string;
  label: string;
  count: string;
  detail: string;
  evidence: string;
  href?: string;
  tone: AdminTone;
  icon: ReactNode;
};

export const surfaceToneClassName: Record<AdminTone, string> = {
  clear: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
  attention: "border-amber-200 bg-amber-50/85 text-amber-950",
  blocked: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-sky-200 bg-sky-50/80 text-sky-950",
};

export const railToneClassName: Record<AdminTone, string> = {
  clear: "bg-emerald-500",
  attention: "bg-amber-500",
  blocked: "bg-destructive",
  info: "bg-sky-500",
};

const glowToneClassName: Record<AdminTone, string> = {
  clear: "shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_18px_38px_rgba(16,185,129,0.12)]",
  attention: "shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_18px_38px_rgba(245,158,11,0.14)]",
  blocked: "shadow-[0_0_0_1px_rgba(239,68,68,0.18),0_18px_38px_rgba(239,68,68,0.12)]",
  info: "shadow-[0_0_0_1px_rgba(14,165,233,0.18),0_18px_38px_rgba(14,165,233,0.12)]",
};

export function EmptyEvidence({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-muted/35 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function LaneTab({
  isActive,
  label,
  count,
  controls,
  onClick,
}: {
  isActive: boolean;
  label: string;
  count: number;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      className={cn(
        "relative min-w-44 border border-b-0 border-border-subtle px-4 py-3 text-left text-sm transition first:rounded-tl-2xl last:rounded-tr-2xl",
        isActive
          ? "bg-bg-default text-foreground shadow-sm"
          : "bg-bg-muted/40 text-muted-foreground hover:bg-bg-default/80 hover:text-foreground",
      )}
      onClick={onClick}
    >
      {isActive ? (
        <span className="absolute inset-x-0 top-0 h-1 bg-foreground" aria-hidden="true" />
      ) : null}
      <span className="block break-words font-semibold">{label}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {count} finding{count === 1 ? "" : "s"}
      </span>
    </button>
  );
}

export function AuditModeTab({
  isActive,
  label,
  count,
  controls,
  onClick,
}: {
  isActive: boolean;
  label: string;
  count: number;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        isActive
          ? "border-foreground bg-foreground text-background"
          : "border-border-subtle bg-bg-default text-foreground hover:bg-bg-muted",
      )}
      onClick={onClick}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 font-mono",
          isActive ? "bg-background/20 text-background" : "bg-bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function ExposureNodeCard({ node }: { node: ExposureNode }) {
  const content = (
    <div
      className={cn(
        "grid min-w-0 gap-2 rounded-2xl border bg-bg-default/90 p-3 transition",
        surfaceToneClassName[node.tone],
        glowToneClassName[node.tone],
        node.href && "hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-xl border border-current/20 bg-white/45">
          {node.icon}
        </span>
        <span className="font-mono text-2xl font-semibold leading-none">{node.count}</span>
      </div>
      <div className="min-w-0">
        <p className="break-words font-semibold">{node.label}</p>
        <p className="mt-1 text-xs leading-4 opacity-80">{node.detail}</p>
        <p className="mt-2 break-words text-xs font-medium">{node.evidence}</p>
      </div>
    </div>
  );

  if (!node.href) {
    return content;
  }

  return (
    <Link href={node.href} className="block" aria-label={`Open ${node.label} evidence`}>
      {content}
    </Link>
  );
}

export function SignalPill({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: AdminTone;
}) {
  return (
    <div className={cn("rounded-2xl border px-3 py-2 shadow-sm backdrop-blur", surfaceToneClassName[tone])}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold leading-none text-foreground">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-4 opacity-75">{detail}</p> : null}
    </div>
  );
}

export function DarkFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <div className="mt-2 text-sm leading-5 text-stone-100">{children}</div>
    </div>
  );
}

export function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-3 border-b border-border-subtle px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
