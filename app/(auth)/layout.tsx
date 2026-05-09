import Link from "next/link";

const signalItems = [
  {
    clinic: "Mamelodi East Clinic",
    status: "Operational",
    detail: "Queue under 18 min",
    tone: "bg-emerald-500",
  },
  {
    clinic: "Atteridgeville CHC",
    status: "Degraded",
    detail: "Pharmacy stock low",
    tone: "bg-amber-400",
  },
  {
    clinic: "Soshanguve Block X",
    status: "Rerouting",
    detail: "2 ambulances redirected",
    tone: "bg-sky-500",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <div className="relative">
        <div className="absolute inset-0 isolate overflow-hidden bg-[#eef3f2]">
          <div
            className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2"
            style={{
              maskImage:
                "linear-gradient(black,transparent 320px),linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
              maskComposite: "intersect",
            }}
          >
            <svg
              className="pointer-events-none absolute inset-0 text-[#d4dee1]"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="auth-grid"
                  x={0.75 * 60 - 1}
                  y={-1}
                  width={60 + 1}
                  height={60 + 1}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={1}
                  />
                </pattern>
              </defs>
              <rect fill="url(#auth-grid)" width="100%" height="100%" />
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

        <Link href="/" className="absolute left-1/2 top-5 z-10 -translate-x-1/2">
          <span className="font-display text-lg font-semibold tracking-[-0.02em] text-neutral-950">
            ClinicPulse
          </span>
        </Link>

        {children}
      </div>

      <aside className="relative hidden h-full flex-col overflow-hidden border-l border-black/5 bg-[#dfe9eb] min-[900px]:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(13,122,107,0.26),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.22),transparent_30%),linear-gradient(160deg,#eef6f4_0%,#d9e5e8_48%,#cddadd_100%)]" />
        <div className="absolute -right-32 top-24 size-72 rounded-full bg-white/35 blur-3xl" />
        <div className="absolute -bottom-24 left-16 size-80 rounded-full bg-[#0D7A6B]/15 blur-3xl" />

        <div className="relative flex min-h-full flex-col justify-between px-8 py-8 lg:px-12 lg:py-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0D7A6B] shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(34,197,94,0.14)]" />
              Live district signal
            </div>

            <h2 className="mt-8 max-w-md font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-neutral-950 lg:text-5xl">
              Know which clinics can serve patients right now.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-neutral-700">
              Secure access for district managers, field reporters, and partner
              teams coordinating live availability across public health sites.
            </p>
          </div>

          <div className="my-10 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-neutral-200/80 bg-[#f8fbfa] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Operations console
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold tracking-tight text-neutral-950">
                    Gauteng North
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  92% online
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {signalItems.map((item) => (
                  <div
                    key={item.clinic}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-neutral-950">{item.clinic}</p>
                        <p className="mt-1 text-sm text-neutral-500">{item.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        <span className={`size-2 rounded-full ${item.tone}`} />
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["3,500+", "clinics tracked"],
              ["<30s", "status updates"],
              ["24/7", "audit history"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/60 bg-white/45 p-4 backdrop-blur"
              >
                <p className="font-display text-2xl font-semibold tracking-tight text-neutral-950">
                  {value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
