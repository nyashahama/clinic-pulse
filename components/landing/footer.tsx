import { ClinicPulseLogo } from "@/components/brand/clinicpulse-logo";
import Link from "next/link";

const navigation = {
  product: [
    { name: "District Console", href: "/demo" },
    { name: "Field Reports", href: "/field" },
    { name: "Clinic Finder", href: "/finder" },
    { name: "Book Demo", href: "/book-demo" },
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
    <footer className="bg-white dark:bg-background">
      <div className="mx-auto w-full max-w-screen-xl border-x border-neutral-100 px-3 dark:border-border lg:px-10">
        <div className="relative z-10 overflow-hidden rounded-t-2xl border border-b-0 border-neutral-200 bg-white px-6 py-16 dark:border-border dark:bg-card sm:px-10">
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
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 lg:grid-cols-2">
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
          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-neutral-500 dark:text-muted-foreground">All systems operational</span>
            </div>
            <p className="max-w-72 text-xs text-neutral-500 dark:text-muted-foreground sm:text-right">
              Demo data is seeded to show the Clinic Pulse operating model.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
