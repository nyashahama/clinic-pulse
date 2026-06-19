import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** The mono "FIG 0.1" style marker. Optional. */
  fig?: string;
  /** The eyebrow line above the heading. Often a domain term. */
  eyebrow?: string;
  /** The h2 text. */
  heading: string;
  /** Optional muted trailing phrase for two-tone treatment. */
  mutedTail?: string;
  /** Optional subhead body text. */
  subhead?: string;
  /** Optional alignment. Default: left. */
  align?: "left" | "center";
  className?: string;
  id?: string;
};

/**
 * Shared section header primitive: optional FIG label + eyebrow + serif h2
 * with optional two-tone muted tail + optional subhead. Used by every section
 * after the hero to give the page a consistent editorial rhythm.
 */
export function SectionHeader({
  fig,
  eyebrow,
  heading,
  mutedTail,
  subhead,
  align = "left",
  className,
  id,
}: SectionHeaderProps) {
  return (
    <header
      id={id}
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {(fig || eyebrow) && (
        <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-clinics-ink-mute">
          {fig && (
            <span className="font-mono text-clinics-canopy">{fig}</span>
          )}
          {eyebrow && <span>{eyebrow}</span>}
        </p>
      )}
      <h2
        className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-clinics-ink sm:text-5xl md:text-6xl"
        style={{ textWrap: "balance" }}
      >
        {heading}
        {mutedTail && (
          <>
            {" "}
            <span className="text-clinics-ink-mute">{mutedTail}</span>
          </>
        )}
      </h2>
      {subhead && (
        <p
          className="mt-6 max-w-2xl text-base leading-relaxed text-clinics-ink-mute sm:text-lg"
          style={{ textWrap: "pretty" }}
        >
          {subhead}
        </p>
      )}
    </header>
  );
}
