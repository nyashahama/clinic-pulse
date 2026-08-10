import { AuthSidebarContent } from "@/components/auth/auth-sidebar-content";
import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import Image from "next/image";
import Link from "next/link";

const clinicCards = [
  {
    name: "Mabopane Station Clinic",
    status: "Non-functional",
    detail: "Generator failure · pharmacy affected",
    statusColor: "bg-red-400",
    accentColor: "border-l-red-400",
    bgColor: "bg-red-400/[0.07]",
    textColor: "text-red-300",
  },
  {
    name: "Akasia Hills Clinic",
    status: "Accepting",
    detail: "Compatible pharmacy service available",
    statusColor: "bg-emerald-300",
    accentColor: "border-l-emerald-300",
    bgColor: "bg-emerald-300/[0.07]",
    textColor: "text-emerald-200",
  },
  {
    name: "AUD-OPS-MAB-001",
    status: "Linked",
    detail: "Source, status change, and reroute recorded",
    statusColor: "bg-sky-300",
    accentColor: "border-l-sky-300",
    bgColor: "bg-sky-300/[0.07]",
    textColor: "text-sky-200",
  },
];

const stats: [string, string][] = [
  ["Source", "attached"],
  ["Route", "ready"],
  ["Audit", "linked"],
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="dark relative grid min-h-[100dvh] min-h-screen grid-cols-1 overflow-x-hidden bg-[#070908] text-white min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_580px]"
      data-public-shell="auth"
      data-public-theme="dark-editorial"
    >
      <div className="relative flex min-w-0 flex-col">
        <div className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-[#070908]">
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(38,85,72,0.24),transparent_58%)]" />
          <div
            className="absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2 opacity-35"
            style={{
              maskImage:
                "linear-gradient(black,transparent 520px),linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
              maskComposite: "intersect",
            }}
          >
            <svg
              className="pointer-events-none absolute inset-0 text-white/[0.08]"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="auth-grid"
                  x={0.75 * 48 - 1}
                  y={-1}
                  width={49}
                  height={49}
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

        <Link
          href="/"
          className="absolute left-5 top-5 z-20 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40 sm:left-7 lg:left-10"
        >
          <ClinicPulseLogo
            iconClassName="size-8 rounded-xl shadow-md shadow-black/30"
            wordmarkClassName="font-display text-base font-semibold tracking-[-0.02em] text-white"
          />
        </Link>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24">
          <div className="w-full max-w-[34rem] rounded-2xl border border-white/[0.09] bg-[#0b0d0c]/92 p-5 shadow-[0_32px_100px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-200/64">
                Secure workspace
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                Illustrative workspace scenario
              </p>
            </div>
            {children}
          </div>
        </main>

        <div className="relative z-10 px-5 pb-6 text-center text-[11px] font-medium leading-5 text-white/28">
          <p>
            By continuing, you agree to ClinicPulse&rsquo;s{" "}
            <Link href="/legal/terms" className="font-semibold text-white/46 hover:text-white/72">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="font-semibold text-white/46 hover:text-white/72">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <aside className="relative hidden h-full min-h-[100dvh] flex-col overflow-hidden border-l border-white/[0.08] bg-[#050606] min-[900px]:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(33,100,80,0.24),transparent_34%),linear-gradient(145deg,#0b1210_0%,#050606_58%)]" />

        <div className="relative flex min-h-full flex-col">
          <div className="relative h-[40%] min-h-[260px] overflow-hidden border-b border-white/[0.08]">
            <Image
              src="/district/clinics/clinic-front-01.jpg"
              alt="Illustrative clinic context for the ClinicPulse workspace"
              fill
              sizes="(min-width: 900px) 580px, 0px"
              className="object-cover grayscale-[0.12] saturate-[0.72]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07100d] via-[#07100d]/52 to-black/18" />

            <div className="absolute inset-x-0 bottom-0 p-7 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-200/76 backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                Modeled incident path
              </div>
              <h2 className="mt-4 max-w-md font-display text-3xl leading-[1.02] tracking-[-0.04em] text-white lg:text-4xl">
                One signal. One decision trail.
              </h2>
            </div>
          </div>

          <AuthSidebarContent
            clinicCards={clinicCards}
            stats={stats}
            description="Secure access for the district, field, and partner teams coordinating the same clinic availability record."
          />
        </div>
      </aside>
    </div>
  );
}
