import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 py-8 sm:flex-row sm:px-10">
        <div className="flex items-center gap-2.5">
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
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            ClinicPulse
          </span>
        </div>

        <p className="text-sm text-neutral-400">
          © 2026 ClinicPulse. Built for South Africa&apos;s primary healthcare system.
        </p>

        <div className="flex gap-6 text-sm">
          <Link
            href="/privacy"
            className="text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
