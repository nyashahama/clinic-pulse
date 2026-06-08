import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BentoTile = {
  /** Optional eyebrow tag in mono (e.g. "DISTRICT" or "FIELD"). */
  eyebrow?: string;
  /** The tile's heading. */
  title: string;
  /** The tile's body. */
  body: string;
  /** Optional product UI preview at the bottom of the tile. */
  preview?: ReactNode;
  /** A short mono caption that appears under the preview. */
  caption?: string;
  /** Layout span. */
  span?: "wide" | "narrow" | "third";
};

type BentoGridProps = {
  tiles: BentoTile[];
  className?: string;
};

/**
 * Asymmetric bento grid (Supabase/Vercel pattern). Renders a 2-column
 * layout on desktop with the first tile spanning the full width if `span="wide"`,
 * otherwise all tiles share width equally.
 */
export function BentoGrid({ tiles, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-clinics-stone bg-clinics-stone sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {tiles.map((tile, i) => {
        const isWide = tile.span === "wide";
        return (
          <article
            key={i}
            className={cn(
              "relative flex flex-col gap-4 bg-clinics-canvas p-8 transition-colors hover:bg-clinics-paper",
              isWide && "sm:col-span-2 lg:col-span-2 lg:row-span-1",
              !isWide && tile.span === "third" && "sm:col-span-1",
            )}
          >
            {tile.eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-clinics-canopy">
                {tile.eyebrow}
              </p>
            )}
            <h3
              className="font-serif text-2xl leading-tight tracking-[-0.01em] text-clinics-ink sm:text-3xl"
              style={{ textWrap: "balance" }}
            >
              {tile.title}
            </h3>
            <p className="text-sm leading-relaxed text-clinics-ink-mute sm:text-base">
              {tile.body}
            </p>
            {tile.preview && (
              <div className="mt-auto overflow-hidden rounded-xl border border-clinics-stone bg-clinics-paper">
                {tile.preview}
              </div>
            )}
            {tile.caption && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-clinics-canopy">
                {tile.caption}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
