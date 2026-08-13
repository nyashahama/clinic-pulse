import { AuthSidebarContent } from "@/components/auth/auth-sidebar-content";
import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import Link from "next/link";

const clinicCards = [
  {
    name: "Mabopane Station Clinic",
    status: "Non-functional",
    detail: "Generator failure · pharmacy affected",
    statusColor: "bg-red-600",
    accentColor: "border-l-red-500",
    bgColor: "bg-red-50",
    textColor: "text-red-800",
  },
  {
    name: "Akasia Hills Clinic",
    status: "Accepting",
    detail: "Compatible pharmacy service available",
    statusColor: "bg-emerald-600",
    accentColor: "border-l-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
  },
  {
    name: "AUD-OPS-MAB-001",
    status: "Linked",
    detail: "Source, status change, and reroute recorded",
    statusColor: "bg-sky-600",
    accentColor: "border-l-sky-600",
    bgColor: "bg-sky-50",
    textColor: "text-sky-800",
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
      className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 overflow-x-hidden bg-[#eef3f2] text-[#171717] [color-scheme:light] min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_560px]"
      data-public-shell="auth"
      data-public-theme="clinical-light"
    >
      <div className="relative flex min-w-0 flex-col bg-[#f7faf9]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-32 -top-40 size-[32rem] rounded-full bg-emerald-100/55 blur-3xl" />
          <div className="absolute -bottom-48 right-[-10rem] size-[30rem] rounded-full bg-sky-100/45 blur-3xl" />
        </div>

        <Link
          href="/"
          className="absolute left-5 top-5 z-20 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/25 sm:left-7 lg:left-10"
        >
          <ClinicPulseLogo
            iconClassName="size-9 rounded-xl shadow-sm"
            wordmarkClassName="font-display text-base font-semibold tracking-[-0.02em] text-[#17201e]"
          />
        </Link>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
          <div
            data-auth-panel="true"
            className="w-full max-w-[34rem] rounded-[1.5rem] border border-neutral-200 bg-white p-5 text-[#171717] shadow-[0_24px_70px_rgba(23,32,30,0.10)] sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A6B]">
                <span className="size-2 rounded-full bg-emerald-600" />
                Secure workspace
              </p>
              <p className="text-xs font-medium text-neutral-500">
                Illustrative workspace scenario
              </p>
            </div>
            {children}
          </div>
        </main>

        <div className="relative z-10 px-5 pb-6 text-center text-xs font-medium leading-5 text-neutral-500">
          <p>
            By continuing, you agree to ClinicPulse&rsquo;s{" "}
            <Link
              href="/legal/terms"
              className="rounded-sm font-semibold text-neutral-700 hover:text-[#0D7A6B]"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="rounded-sm font-semibold text-neutral-700 hover:text-[#0D7A6B]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <aside className="relative hidden min-h-[100dvh] flex-col overflow-hidden border-l border-emerald-900/10 bg-[#e4eeeb] min-[900px]:flex">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-white/70 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-[-10rem] size-[28rem] rounded-full bg-emerald-200/55 blur-3xl" />
        </div>

        <div className="relative flex min-h-full flex-col px-8 py-10 lg:px-10 lg:py-12">
          <div className="rounded-[1.5rem] border border-white/80 bg-white/72 p-6 shadow-[0_20px_60px_rgba(23,32,30,0.08)] backdrop-blur-sm lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-600" />
              Modeled incident path
            </div>
            <h2 className="mt-5 max-w-md font-display text-3xl leading-[1.04] tracking-[-0.04em] text-[#17201e] lg:text-4xl">
              One signal. One accountable decision trail.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-neutral-600">
              Every team works from the same clinic status, reroute and evidence record.
            </p>
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
