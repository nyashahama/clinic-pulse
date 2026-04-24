const partners = [
  { name: "WHO", initials: "W" },
  { name: "Right to Care", initials: "RC" },
  { name: "BroadReach", initials: "BR" },
  { name: "moms2", initials: "M2" },
  { name: "Jhpiego", initials: "JP" },
  { name: "PEPFAR", initials: "PF" },
];

export function LogoCarousel() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-10 text-center text-xs font-medium uppercase tracking-widest text-neutral-400">
          Trusted by leading health organizations across 52 districts
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="group flex items-center gap-3 opacity-60 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-xs font-bold text-white">
                {partner.initials}
              </div>
              <span className="text-sm font-medium text-neutral-500 transition-colors group-hover:text-neutral-900">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}