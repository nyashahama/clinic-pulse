type PaperNoiseProps = {
  className?: string;
  /** Opacity 0-1. Defaults to 0.05. */
  intensity?: number;
};

/**
 * A subtle SVG noise overlay for tactile premium feel (Linear/Resend/Arc pattern).
 * Inline as a fixed-position div with a generated SVG data-URI so it has zero
 * network cost and respects `prefers-color-scheme` via opacity.
 */
export function PaperNoise({ className, intensity = 0.05 }: PaperNoiseProps) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>`,
  );

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundSize: "240px 240px",
        opacity: intensity,
        pointerEvents: "none",
      }}
    />
  );
}
