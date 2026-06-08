import { SectionHeader } from "@/components/landing/sections/section-header";

const TRUST_ROWS = [
  {
    category: "Data Residency",
    value: "South Africa — Gauteng",
    detail: "All data stays in-country. No offshore processing. POPIA-aligned.",
    icon: "🇿🇦",
  },
  {
    category: "Access Control",
    value: "Role-based, per-station",
    detail: "Officers see their station. Managers see their district. Auditors see the trail.",
    icon: "🔒",
  },
  {
    category: "Audit Trail",
    value: "Immutable, timestamped",
    detail: "Every field entry, every override, every sign-off — on the record, attributed, uneditable.",
    icon: "📋",
  },
  {
    category: "Encryption",
    value: "AES-256 at rest, TLS 1.3 in transit",
    detail: "Bank-grade encryption. Your data is never in plaintext outside your device.",
    icon: "🔐",
  },
  {
    category: "Availability",
    value: "99.9% uptime SLA",
    detail: "Built for the people who run the stations. If the station is open, ClinicPulse is up.",
    icon: "⚡",
  },
];

/**
 * TrustInfrastructure — rewritten as a clean data table. The old version
 * had motion, useInView, animated TrustCards with Shield/Lock/Key icons.
 * The new version uses a static table with the clinics palette.
 */
export function TrustInfrastructure() {
  return (
    <section id="trust" className="bg-clinics-paper py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader
          fig="0.4"
          eyebrow="Trust"
          heading="Your data stays in your jurisdiction."
          mutedTail="Always."
          subhead="POPIA-aligned by design. No offshore processing, no third-party data sharing, no surprises."
        />

        <div className="mt-16 overflow-hidden rounded-2xl border border-clinics-stone">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-clinics-stone bg-clinics-canvas">
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-clinics-ink-mute">
                  Category
                </th>
                <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-clinics-ink-mute">
                  Standard
                </th>
                <th className="hidden px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-clinics-ink-mute md:table-cell">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {TRUST_ROWS.map((row) => (
                <tr
                  key={row.category}
                  className="border-b border-clinics-stone last:border-0"
                >
                  <td className="px-6 py-4">
                    <span className="mr-2 text-base">{row.icon}</span>
                    <span className="font-serif text-sm text-clinics-ink">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-clinics-ink-mute">
                    {row.value}
                  </td>
                  <td className="hidden px-6 py-4 text-xs text-clinics-ink-mute md:table-cell">
                    {row.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
