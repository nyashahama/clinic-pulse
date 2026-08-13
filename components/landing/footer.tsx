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
    { name: "Operating Gap", href: "/#problem" },
    { name: "Product Flow", href: "/#flow" },
    { name: "Product Surfaces", href: "/#product" },
    { name: "Trust Layer", href: "/#trust" },
  ],
};

export function Footer() {
  return (
    <footer
      data-public-chrome="light"
      className="border-t border-neutral-200 bg-white text-[#17201e]"
    >
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-10">
        <div className="relative z-10 overflow-hidden px-0 py-12 sm:py-14">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="flex flex-col gap-6">
              <div className="grow">
                <Link href="/" className="block max-w-fit">
                  <ClinicPulseLogo
                    iconClassName="size-6 rounded-md"
                    wordmarkClassName="text-sm"
                  />
                </Link>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-card-foreground">Product</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-muted-foreground dark:hover:text-foreground"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-card-foreground">Proof</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.proof.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-muted-foreground dark:hover:text-foreground"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-neutral-600">Illustrative workspace ready</span>
            </div>
            <p className="max-w-72 text-xs leading-5 text-neutral-500 sm:text-right">
              Scenario data is local to the walkthrough and mirrors the Clinic Pulse operating model.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
