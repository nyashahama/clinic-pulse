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
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-lg transition-all dark:border-border dark:bg-background/92">
        <div
          className={cn(
            "absolute inset-0 block transition-all",
            scrolled && "bg-white/85 dark:bg-background/90",
          )}
        />
        <div className="relative mx-auto w-full max-w-screen-xl px-3 lg:px-10">
          <div className="flex h-14 items-center justify-between gap-3">
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
                  className="relative flex items-center rounded-md px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-white/10 dark:hover:text-foreground"
                >
                  {name}
                </Link>
              ))}
              <div className="h-5 w-px bg-neutral-200 dark:bg-border" />
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                Operations workspace
              </span>
            </div>

            <div className="flex grow basis-0 justify-end gap-2 lg:hidden">
              <Link
                href="/login"
                className="flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-8 items-center rounded-lg border border-neutral-900 bg-neutral-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
              >
                Book demo
              </Link>
            </div>

            <div className="hidden grow basis-0 justify-end gap-2 lg:flex">
              <Link
                href="/login"
                className="flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
              >
                Sign in
              </Link>
              <Link
                href="/?booking=1"
                className="flex h-8 items-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
              >
                Book demo
              </Link>
            </div>
          </div>

          <nav className="-mx-3 flex gap-1 overflow-x-auto border-t border-neutral-200 px-3 py-2 dark:border-border lg:hidden">
            {NAV_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-white/10 dark:hover:text-foreground"
              >
                {name}
              </Link>
            ))}
            <span className="ml-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-neutral-500 dark:text-muted-foreground">
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
