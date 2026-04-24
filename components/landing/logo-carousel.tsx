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
    <section className="border-border border-t px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="mb-8 text-center text-sm text-neutral-400">
          Trusted by leading health organizations across 52 districts
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-500">
                {partner.initials}
              </div>
              <span className="text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}