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
      <header
        data-public-chrome="light"
        className="fixed inset-x-0 top-0 z-50 w-full border-b border-neutral-200 bg-white/94 text-[#17201e] backdrop-blur-xl transition-all"
      >
        <div
          className={cn(
            "absolute inset-0 block transition-all",
            scrolled && "bg-white/96 shadow-[0_12px_32px_rgba(23,32,30,0.08)]",
          )}
        />
        <div className="relative mx-auto w-full max-w-screen-xl px-3 lg:px-10">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="grow basis-0">
              <Link href="/" className="block w-fit rounded-md py-2 pr-2">
                <ClinicPulseLogo />
              </Link>
            </div>

            <div className="hidden items-center gap-2 xl:flex">
              {NAV_ITEMS.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="relative flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-emerald-50 hover:text-[#0D7A6B]"
                >
                  {name}
                </Link>
              ))}
              <div className="h-5 w-px bg-neutral-200" />
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                Operations workspace
              </span>
            </div>

            <div className="flex shrink-0 justify-end gap-2 xl:hidden">
              <Link
                href="/login"
                className="flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-[#0D7A6B]/40 hover:text-[#0D7A6B] sm:px-5"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-[#0D7A6B] bg-[#0D7A6B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#09695d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/25 sm:px-5"
              >
                Book walkthrough
              </Link>
            </div>

            <div className="hidden grow basis-0 justify-end gap-2 xl:flex">
              <Link
                href="/login"
                className="flex h-11 items-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 transition-colors hover:border-[#0D7A6B]/40 hover:text-[#0D7A6B]"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-11 items-center rounded-full border border-[#0D7A6B] bg-[#0D7A6B] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#09695d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/25"
              >
                Book walkthrough
              </Link>
            </div>
          </div>

          <nav className="-mx-3 grid grid-cols-4 border-t border-neutral-200 px-3 py-1.5 xl:hidden">
            {NAV_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="flex h-10 items-center justify-center rounded-lg px-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-emerald-50 hover:text-[#0D7A6B]"
              >
                {name}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="h-[6.75rem] xl:h-14" aria-hidden="true" />
    </>
  );
}
