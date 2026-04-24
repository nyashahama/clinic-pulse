import Link from "next/link";

export function Nav() {
  return (
    <nav className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-neutral-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2">
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

      <div className="hidden items-center gap-1 text-sm md:flex">
        <Link
          href="#problem"
          className="rounded-md px-3 py-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          Problem
        </Link>
        <Link
          href="#platform"
          className="rounded-md px-3 py-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          Platform
        </Link>
        <Link
          href="#features"
          className="rounded-md px-3 py-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          Features
        </Link>
        <Link
          href="#proof"
          className="rounded-md px-3 py-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          Testimonials
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:block"
        >
          Sign in
        </Link>
        <Link
          href="/demo"
          className="inline-flex items-center rounded-lg border border-neutral-900 bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
        >
          Request Demo
        </Link>
      </div>
    </nav>
  );
}