import Link from "next/link";

const navigation = {
  product: [
    { name: "District Console", href: "/demo" },
    { name: "Field Reports", href: "/field" },
    { name: "Clinic Finder", href: "/finder" },
    { name: "Book Demo", href: "/book-demo" },
  ],
  proof: [
    { name: "Product Flow", href: "/#flow" },
    { name: "Routing Moment", href: "/#routing" },
    { name: "Trust Layer", href: "/#trust" },
  ],
};

export function Footer() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-screen-xl border-x border-neutral-200 px-3 lg:px-10">
        <div className="relative z-10 overflow-hidden rounded-t-2xl border border-b-0 border-neutral-200 bg-white/50 px-6 py-16 backdrop-blur-lg sm:px-10">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="flex flex-col gap-6">
              <div className="grow">
                <Link href="/" className="block max-w-fit">
                  <span className="text-sm font-semibold tracking-tight text-neutral-900">
                    ClinicPulse
                  </span>
                </Link>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Product</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-700"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Proof</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.proof.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-700"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-neutral-500">All systems operational</span>
            </div>
            <p className="text-xs text-neutral-500">
              Demo data is seeded to show the operating model.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

