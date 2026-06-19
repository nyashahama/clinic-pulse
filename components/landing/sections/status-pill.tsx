import { cn } from "@/lib/utils";

type StatusTone = "operational" | "degraded" | "non-functional" | "info";

const TONE_CLASSES: Record<StatusTone, { dot: string; text: string }> = {
  operational: { dot: "bg-clinics-canopy", text: "text-clinics-canopy" },
  degraded: { dot: "bg-clinics-amber", text: "text-clinics-amber" },
  "non-functional": { dot: "bg-clinics-rose", text: "text-clinics-rose" },
  info: { dot: "bg-clinics-cobalt", text: "text-clinics-cobalt" },
};

type StatusPillProps = {
  tone?: StatusTone;
  label: string;
  className?: string;
  /** Render the leading dot indicator. Default true. */
  withDot?: boolean;
};

/**
 * A small live status pill. Mono label, colored leading dot, optional
 * pulse animation. Used in the trust section, the final CTA, and the footer.
 * Replaces the dub `animate-pulse-dot` pattern.
 */
export function StatusPill({
  tone = "operational",
  label,
  className,
  withDot = true,
}: StatusPillProps) {
  const toneClasses = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]",
        toneClasses.text,
        className,
      )}
    >
      {withDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60",
              toneClasses.dot,
            )}
            style={{ animation: "pulse-live-indicator 2.4s ease-in-out infinite" }}
          />
          <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", toneClasses.dot)} />
        </span>
      )}
      {label}
    </span>
  );
}
