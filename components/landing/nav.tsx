"use client";

import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/80 px-6 backdrop-blur-md lg:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0D7A6B]">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
          ClinicPulse
        </span>
      </Link>

      <div className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
        <Link
          href="#problem"
          className="transition-colors hover:text-neutral-900"
        >
          Problem
        </Link>
        <Link
          href="#platform"
          className="transition-colors hover:text-neutral-900"
        >
          Platform
        </Link>
        <Link
          href="#features"
          className="transition-colors hover:text-neutral-900"
        >
          Features
        </Link>
        <Link
          href="#cta"
          className="transition-colors hover:text-neutral-900"
        >
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 sm:inline-block"
        >
          Sign in
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
        >
          Request Demo
        </Link>
      </div>
    </nav>
  );
}
