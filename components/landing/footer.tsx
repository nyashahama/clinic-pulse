import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import Link from "next/link";

const navigation = {
  product: [
    { name: "District Console", href: "/district" },
    { name: "Field Reports", href: "/field" },
    { name: "Clinic Finder", href: "/finder" },
    { name: "Book Walkthrough", href: "/request-walkthrough" },
  ],
  proof: [
    { name: "How it works", href: "/#how-it-works" },
    { name: "Product surfaces", href: "/#product-surfaces" },
    { name: "Trust and evidence", href: "/#trust-and-evidence" },
    { name: "Sign in", href: "/login" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-landing-ink/12 bg-landing-paper px-4 text-landing-ink dark:border-white/10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[80rem] py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.85fr)] lg:gap-16">
          <div>
            <Link href="/" className="block max-w-fit">
              <ClinicPulseLogo
                iconClassName="size-7 rounded-md"
                wordmarkClassName="text-sm text-landing-ink dark:text-white"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-landing-ink/70 dark:text-white/70">
              Clinic service status, patient routing, and the operating evidence behind each decision.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-ink/68 dark:text-white/70">
                Product
              </h3>
              <ul role="list" className="mt-3 flex flex-col gap-3">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-landing-ink/62 transition-colors hover:text-landing-green dark:text-white/60 dark:hover:text-landing-mint"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-ink/68 dark:text-white/70">
                Explore
              </h3>
              <ul role="list" className="mt-3 flex flex-col gap-3">
                {navigation.proof.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-landing-ink/62 transition-colors hover:text-landing-green dark:text-white/60 dark:hover:text-landing-mint"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-landing-ink/12 pt-6 text-xs text-landing-ink/68 dark:border-white/10 dark:text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-mono uppercase tracking-[0.1em]">
            <span className="size-2 rotate-45 bg-landing-green" aria-hidden="true" />
            Seeded walkthrough data
          </div>
          <p className="max-w-md sm:text-right">
            Illustrative product scenario. No deployment activity or live clinic status is represented.
          </p>
        </div>
      </div>
    </footer>
  );
}
