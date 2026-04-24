const partners = [
  "WHO",
  "Right to Care",
  "BroadReach",
  "moms2",
  "Jhpiego",
  "PEPFAR",
];

export function LogoCarousel() {
  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto max-w-[1200px] text-center">
        <p className="mb-6 text-sm text-neutral-400">
          Trusted by leading health organizations
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((partner) => (
            <span
              key={partner}
              className="text-sm font-semibold tracking-tight text-neutral-300 opacity-50 transition-all hover:opacity-100 hover:text-neutral-900"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
