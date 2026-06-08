import { SectionHeader } from "@/components/landing/sections/section-header";
import { TrustSystemPanels } from "@/components/landing/trust-system-panels";

const TRUST_ROWS = [
  {
    category: "Data Residency",
    value: "South Africa — Gauteng",
    detail: "All data stays in-country. No offshore processing. POPIA-aligned.",
  },
  {
    category: "Access Control",
    value: "Role-based, per-station",
    detail: "Officers see their station. Managers see their district. Auditors see the trail.",
  },
  {
    category: "Audit Trail",
    value: "Immutable, timestamped",
    detail: "Every field entry, every override, every sign-off — on the record, attributed, uneditable.",
  },
  {
    category: "Encryption",
    value: "AES-256 at rest, TLS 1.3 in transit",
    detail: "Bank-grade encryption. Your data is never in plaintext outside your device.",
  },
  {
    category: "Availability",
    value: "99.9% uptime SLA",
    detail: "Built for the people who run the stations. If the station is open, ClinicPulse is up.",
  },
];

/**
 * TrustInfrastructure — rewritten with real TrustSystemPanels.
 * The old version had a static data table only. The new version
 * combines the trust standards table with real audit trail panels.
 */
export function TrustInfrastructure() {
  return (
    <section id="trust" className="bg-clinics-paper py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          fig="0.4"
          eyebrow="Trust"
          heading="Public-sector trust lives in the evidence chain."
          subhead="Every operating decision keeps its source, timestamp, change reason, operator guidance, and partner handler visible for public-sector review."
        />

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-clinics-stone">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-clinics-stone bg-clinics-canvas">
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-clinics-ink-mute">
                    Category
                  </th>
                  <th className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-clinics-ink-mute">
                    Standard
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
                      <span className="font-serif text-sm text-clinics-ink">
                        {row.category}
                      </span>
                      <p className="mt-1 text-xs text-clinics-ink-mute">
                        {row.detail}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-clinics-ink-mute">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <TrustSystemPanels />
          </div>
        </div>
      </div>
    </section>
  );
}
