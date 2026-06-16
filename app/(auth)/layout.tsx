import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import Link from "next/link";

const signalItems = [
  {
    clinic: "Mamelodi East Clinic",
    status: "Operational",
    detail: "Queue under 18 min",
    tone: "bg-emerald-500",
    toneRing: "shadow-[0_0_0_5px_rgba(34,197,94,0.14)]",
  },
  {
    clinic: "Atteridgeville CHC",
    status: "Degraded",
    detail: "Pharmacy stock low",
    tone: "bg-amber-400",
    toneRing: "shadow-[0_0_0_5px_rgba(251,191,36,0.14)]",
  },
  {
    clinic: "Soshanguve Block X",
    status: "Rerouting",
    detail: "2 ambulances redirected",
    tone: "bg-sky-500",
    toneRing: "shadow-[0_0_0_5px_rgba(14,165,233,0.14)]",
  },
];

const statusBreakdown = [
  { label: "Operational", count: 89, tone: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  { label: "Degraded", count: 7, tone: "bg-amber-400", bg: "bg-amber-400/10", text: "text-amber-700" },
  { label: "Non-functional", count: 3, tone: "bg-red-500", bg: "bg-red-500/10", text: "text-red-700" },
  { label: "Unknown", count: 1, tone: "bg-slate-400", bg: "bg-slate-400/10", text: "text-slate-600" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <div className="relative flex flex-col">
        <div className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-[#f8fbfa] dark:bg-background">
          <div
            className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2"
            style={{
              maskImage:
                "linear-gradient(black,transparent 320px),linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
              maskComposite: "intersect",
            }}
          >
            <svg
              className="pointer-events-none absolute inset-0 text-[#e5ebee] dark:text-border"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="auth-grid"
                  x={0.75 * 48 - 1}
                  y={-1}
                  width={48 + 1}
                  height={48 + 1}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 48 0 L 0 0 0 48"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={0.5}
                  />
                </pattern>
              </defs>
              <rect fill="url(#auth-grid)" width="100%" height="100%" />
            </svg>
          </div>
          <div className="absolute left-[20%] top-[15%] size-[500px] rounded-full bg-[#0D7A6B]/[0.04] blur-[100px]" />
          <div className="absolute right-[10%] bottom-[20%] size-[400px] rounded-full bg-sky-500/[0.03] blur-[80px]" />
        </div>

        <Link href="/" className="absolute left-6 top-5 z-10 min-[900px]:left-8 lg:left-12">
          <ClinicPulseLogo
            iconClassName="size-8 rounded-xl shadow-md shadow-emerald-950/15"
            wordmarkClassName="font-display text-lg font-semibold tracking-[-0.02em] text-neutral-950 dark:text-foreground"
          />
        </Link>

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-24 sm:px-6">
          {children}
        </div>

        <div className="relative z-10 pb-6 text-center text-xs font-medium leading-5 text-neutral-400 dark:text-muted-foreground">
          <p>
            By continuing, you agree to ClinicPulse&rsquo;s{" "}
            <Link href="/legal/terms" className="font-semibold text-neutral-500 hover:text-neutral-700 dark:text-muted-foreground dark:hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="font-semibold text-neutral-500 hover:text-neutral-700 dark:text-muted-foreground dark:hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <aside className="relative hidden h-full flex-col overflow-hidden border-l border-black/5 dark:border-border min-[900px]:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8f0ee] via-[#dfe8ea] to-[#d4dedf] dark:from-[#111315] dark:via-[#161819] dark:to-[#121415]" />
        <div className="absolute -right-24 top-20 size-64 rounded-full bg-white/30 blur-3xl dark:bg-white/5" />
        <div className="absolute -bottom-16 left-12 size-72 rounded-full bg-[#0D7A6B]/10 blur-3xl dark:bg-[#0D7A6B]/5" />

        <div className="relative flex min-h-full flex-col px-8 py-8 lg:px-12 lg:py-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0D7A6B]/20 bg-[#0D7A6B]/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0D7A6B] backdrop-blur dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Live district signal
            </div>
          </div>

          <h2 className="max-w-md font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-neutral-950 dark:text-foreground lg:text-[2.75rem]">
            Know which clinics can serve patients right now.
          </h2>
          <p className="mt-4 max-w-md text-[0.95rem] leading-7 text-neutral-600 dark:text-muted-foreground">
            Secure access for district managers, field reporters, and partner
            teams coordinating live availability across public health sites.
          </p>

          <div className="my-8 flex-1 rounded-2xl border border-white/60 bg-white/50 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-black/20">
            <div className="rounded-xl border border-neutral-200/60 bg-white/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-muted-foreground">
                    Operations console
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold tracking-tight text-neutral-950 dark:text-foreground">
                    Gauteng North
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  92% online
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {statusBreakdown.map((item) => (
                  <div key={item.label} className={`rounded-lg ${item.bg} p-2.5 text-center`}>
                    <p className={`text-lg font-bold ${item.text}`}>{item.count}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {signalItems.map((item) => (
                <div
                  key={item.clinic}
                  className="group rounded-xl border border-neutral-100 bg-white/70 p-3.5 shadow-sm transition hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-foreground">{item.clinic}</p>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-muted-foreground">
                      <span className={`size-1.5 rounded-full ${item.tone} shadow-[0_0_0_3px_rgba(34,197,94,0.1)]`} />
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              ["3,500+", "clinics tracked"],
              ["<30s", "status updates"],
              ["24/7", "audit history"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/50 bg-white/40 p-3 text-center backdrop-blur dark:border-white/[0.05] dark:bg-white/[0.02]"
              >
                <p className="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-foreground">
                  {value}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:text-muted-foreground">
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
