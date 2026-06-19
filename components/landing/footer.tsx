import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import Link from "next/link";

const FOOTER_LINKS = [
  { name: "Product", href: "#product" },
  { name: "Trust", href: "#trust" },
  { name: "Manifesto", href: "#manifesto" },
  { name: "Login", href: "/login" },
];

export function Footer() {
  return (
    <footer className="border-t border-clinics-stone bg-clinics-paper py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <ClinicPulseLogo />
          <span className="text-sm text-clinics-ink-mute">
            &copy; {new Date().getFullYear()} ClinicPulse
          </span>
        </div>
        <nav className="flex gap-4">
          {FOOTER_LINKS.map(({ name, href }) => (
            <Link
              key={name}
              href={href}
              className="text-sm text-clinics-ink-mute transition-colors hover:text-clinics-ink"
            >
              {name}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
