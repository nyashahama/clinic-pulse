import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleDot, CircleX, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import type { IncidentTone } from "@/lib/landing/operational-narrative-content";
import { cn } from "@/lib/utils";

const toneStyles: Record<IncidentTone, { className: string; icon: LucideIcon }> = {
  neutral: {
    className:
      "border-landing-ink/20 bg-landing-ink/6 text-landing-ink dark:border-white/20 dark:bg-white/8",
    icon: CircleDot,
  },
  healthy: {
    className:
      "border-landing-green/35 bg-landing-green/10 text-[#06685d] dark:border-landing-green/45 dark:bg-landing-green/12 dark:text-landing-green",
    icon: CircleCheck,
  },
  warning: {
    className:
      "border-landing-warning/35 bg-landing-warning/10 text-amber-900 dark:border-landing-warning/45 dark:bg-landing-warning/12 dark:text-landing-warning",
    icon: TriangleAlert,
  },
  critical: {
    className:
      "border-landing-critical/35 bg-landing-critical/10 text-red-800 dark:border-landing-critical/45 dark:bg-landing-critical/12 dark:text-landing-critical",
    icon: CircleX,
  },
};

const invertedToneStyles: Record<IncidentTone, string> = {
  neutral: "!border-white/20 !bg-white/8 !text-white",
  healthy: "!border-landing-mint/40 !bg-landing-mint/10 !text-landing-mint",
  warning: "!border-[#f5c35b]/40 !bg-[#f5c35b]/10 !text-[#f5c35b]",
  critical: "!border-[#ff8a8e]/40 !bg-[#ff8a8e]/10 !text-[#ff8a8e]",
};

export function OperationalStatus({
  children,
  className,
  inverted = false,
  tone,
}: {
  children: ReactNode;
  className?: string;
  inverted?: boolean;
  tone: IncidentTone;
}) {
  const style = toneStyles[tone];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold leading-4",
        style.className,
        inverted ? invertedToneStyles[tone] : null,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}
