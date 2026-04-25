"use client";

import { cn } from "@/lib/utils";
import { useScroll } from "@/lib/hooks/use-scroll";
import Link from "next/link";

const NAV_ITEMS = [
  { name: "Product", href: "#product" },
  { name: "Interfaces", href: "#interfaces" },
  { name: "Proof", href: "#proof" },
];

export function Nav() {
  const scrolled = useScroll(40);

  return (
    <div className={cn("sticky inset-x-0 top-0 z-30 w-full transition-all")}>
      <div
        className={cn(
          "absolute inset-0 block border-b border-transparent transition-all",
          scrolled && "border-neutral-200/80 bg-white/75 backdrop-blur-lg",
        )}
      />
      <div className="relative mx-auto w-full max-w-screen-xl px-3 lg:px-10">
        <div className="flex h-14 items-center justify-between">
          <div className="grow basis-0">
            <Link href="/" className="block w-fit py-2 pr-2">
              <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
                ClinicPulse
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="relative flex items-center rounded-md px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
              >
                {name}
              </Link>
            ))}
          </div>

          <div className="hidden grow basis-0 justify-end gap-2 lg:flex">
            <Link
              href="/login"
              className="flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              Sign in
            </Link>
            <Link
              href="/demo"
              className="flex h-8 items-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
