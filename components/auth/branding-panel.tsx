export function BrandingPanel() {
  return (
    <div className="relative hidden min-h-screen min-[900px]:block">
      <div className="absolute inset-0 isolate overflow-hidden bg-white">
        <div
          className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2"
          style={{
            maskImage:
              "linear-gradient(black,transparent 320px),linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
            maskComposite: "intersect",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 text-neutral-200"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="branding-grid"
                x={0.75 * 60 - 1}
                y={-1}
                width={60 + 1}
                height={60 + 1}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M 60 0 L 0 0 0 60`}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={1}
                />
              </pattern>
            </defs>
            <rect fill="url(#branding-grid)" width="100%" height="100%" />
          </svg>
        </div>

        <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] mix-blend-overlay">
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
        </div>
        <div className="absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6] opacity-10">
          <div className="absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2] bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]" />
        </div>
      </div>

      <div className="relative flex h-full flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold tracking-tight text-neutral-900">
          ClinicPulse
        </span>
      </div>
    </div>
  );
}
