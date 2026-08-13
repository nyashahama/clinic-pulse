"use client";

import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import { cn } from "@/lib/utils";
import { useScroll } from "@/lib/hooks/use-scroll";
import Link from "next/link";

const NAV_ITEMS = [
  { name: "Problem", href: "#problem" },
  { name: "Flow", href: "#flow" },
  { name: "Product", href: "#product" },
  { name: "Trust", href: "#trust" },
];

export function Nav() {
  const scrolled = useScroll(40);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/[0.08] bg-[#070908]/90 text-white backdrop-blur-xl transition-all">
        <div
          className={cn(
            "absolute inset-0 block transition-all",
            scrolled && "bg-[#070908]/92 shadow-[0_18px_60px_rgba(0,0,0,0.26)]",
          )}
        />
        <div className="relative mx-auto w-full max-w-screen-xl px-3 lg:px-10">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="grow basis-0">
              <Link href="/" className="block w-fit rounded-md py-2 pr-2">
                <ClinicPulseLogo />
              </Link>
            </div>

            <div className="hidden items-center gap-4 lg:flex">
              {NAV_ITEMS.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="relative flex items-center rounded-md px-3 py-2 text-xs font-medium text-white/52 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {name}
                </Link>
              ))}
              <div className="h-5 w-px bg-white/10" />
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/56">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                Operations workspace
              </span>
            </div>

            <div className="flex shrink-0 justify-end gap-2 lg:hidden">
              <Link
                href="/login"
                className="flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] px-3 text-xs font-semibold text-white/76 transition-colors hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border border-white bg-white px-3 text-xs font-semibold text-neutral-950 transition-colors hover:bg-white/88 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/25"
              >
                Book walkthrough
              </Link>
            </div>

            <div className="hidden grow basis-0 justify-end gap-2 lg:flex">
              <Link
                href="/login"
                className="flex h-8 items-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-medium text-white/74 transition-colors hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-8 items-center rounded-full border border-white bg-white px-4 text-xs font-semibold text-neutral-950 transition-colors hover:bg-white/88 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/25"
              >
                Book walkthrough
              </Link>
            </div>
          </div>

          <nav className="-mx-3 flex gap-1 overflow-x-auto border-t border-white/[0.06] px-3 py-2 lg:hidden">
            {NAV_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="flex h-8 shrink-0 items-center rounded-md px-3 text-[11px] font-semibold text-white/48 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {name}
              </Link>
            ))}
            <span className="ml-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 font-mono text-[10px] uppercase tracking-[0.1em] text-white/56">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              Live operations
            </span>
          </nav>
        </div>
      </header>
      <div className="h-24 lg:h-14" aria-hidden="true" />
    </>
  );
}
