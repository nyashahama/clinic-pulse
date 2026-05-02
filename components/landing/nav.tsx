"use client";

import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import { cn } from "@/lib/utils";
import { useScroll } from "@/lib/hooks/use-scroll";
import Link from "next/link";

const NAV_ITEMS = [
  { name: "Product Flow", href: "#flow" },
  { name: "Routing", href: "#routing" },
  { name: "Trust", href: "#trust" },
];

export function Nav() {
  const scrolled = useScroll(40);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-[#d4dee1] bg-[#eef3f2]/90 backdrop-blur-lg transition-all">
        <div
          className={cn(
            "absolute inset-0 block transition-all",
            scrolled && "bg-white/85",
          )}
        />
        <div className="relative mx-auto w-full max-w-screen-xl px-3 lg:px-10">
          <div className="flex h-14 items-center justify-between">
            <div className="grow basis-0">
              <Link href="/" className="block w-fit py-2 pr-2">
                <ClinicPulseLogo />
              </Link>
            </div>

            <div className="hidden items-center gap-4 lg:flex">
              {NAV_ITEMS.map(({ name, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="relative flex items-center rounded-md px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
                >
                  {name}
                </Link>
              ))}
              <div className="h-5 w-px bg-neutral-200" />
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                Demo workspace
              </span>
            </div>

            <div className="hidden grow basis-0 justify-end gap-2 lg:flex">
              <Link
                href="/login"
                className="flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-8 items-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Book Demo
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="h-14" aria-hidden="true" />
    </>
  );
}
