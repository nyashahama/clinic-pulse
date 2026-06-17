import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import { AuthSidebarContent } from "@/components/auth/auth-sidebar-content";
import Image from "next/image";
import Link from "next/link";

const clinicCards = [
  {
    name: "Mamelodi East Clinic",
    status: "Operational",
    detail: "Queue under 18 min",
    statusColor: "bg-emerald-400",
    accentColor: "border-l-emerald-400",
    bgColor: "bg-emerald-400/10",
    textColor: "text-emerald-300",
  },
  {
    name: "Atteridgeville CHC",
    status: "Degraded",
    detail: "Pharmacy stock low",
    statusColor: "bg-amber-400",
    accentColor: "border-l-amber-400",
    bgColor: "bg-amber-400/10",
    textColor: "text-amber-300",
  },
  {
    name: "Soshanguve Block X",
    status: "Rerouting",
    detail: "2 ambulances redirected",
    statusColor: "bg-sky-400",
    accentColor: "border-l-sky-400",
    bgColor: "bg-sky-400/10",
    textColor: "text-sky-300",
  },
];

const stats: [string, string][] = [
  ["3,500+", "clinics"],
  ["<30s", "updates"],
  ["24/7", "audit"],
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <div className="relative flex flex-col">
        <div className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-[#f6f8f7] dark:bg-background">
          <div
            className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2"
            style={{
              maskImage:
                "linear-gradient(black,transparent 320px),linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
              maskComposite: "intersect",
            }}
          >
            <svg
              className="pointer-events-none absolute inset-0 text-[#e2e8ea] dark:text-border"
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2b26] via-[#0a1f1b] to-[#061512]" />

        <div className="relative flex min-h-full flex-col">
          <div className="relative h-[45%] min-h-[280px] overflow-hidden">
            <Image
              src="/districts/clinics/clinic-front-01.jpg"
              alt="Healthcare worker using ClinicPulse"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f2b26] via-[#0f2b26]/60 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 backdrop-blur-sm">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                Live district signal
              </div>
              <h2 className="mt-4 max-w-md font-display text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-white lg:text-4xl">
                Know which clinics can serve patients right now.
              </h2>
            </div>
          </div>

          <AuthSidebarContent
            clinicCards={clinicCards}
            stats={stats}
            description="Secure access for district managers, field reporters, and partner teams coordinating live availability across public health sites."
          />
        </div>
      </aside>
    </div>
  );
}
