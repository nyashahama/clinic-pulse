"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What happens when a clinic goes offline?",
    answer:
      "Field workers submit reports through the mobile app even without signal. Data saves locally and syncs automatically when connectivity returns. The district console updates in real time once the sync completes — no double entries, no data loss.",
  },
  {
    question: "How does patient rerouting work?",
    answer:
      "When a clinic's status changes to non-functional or degraded, ClinicPulse identifies the nearest operational alternatives based on capacity, services offered, and distance. The public finder updates immediately so patients know where to go before they travel.",
  },
  {
    question: "Is ClinicPulse compliant with POPIA?",
    answer:
      "Yes. All data is encrypted at rest and in transit. Access is role-based — field workers see only their assigned clinics, district managers see their district, and system admins have full visibility. Every change is logged in an immutable audit trail for compliance reviews.",
  },
  {
    question: "How does it integrate with DHIS2?",
    answer:
      "ClinicPulse reads from and writes to DHIS2 via its standard API. Clinic hierarchies, org units, and data elements sync automatically. District teams use ClinicPulse as the real-time operational layer on top of DHIS2's reporting foundation.",
  },
  {
    question: "How long does deployment take?",
    answer:
      "A typical district deployment takes 2–4 weeks. We configure the clinic hierarchy, set up user roles, connect to DHIS2, and train district teams. Field workers receive a 30-minute onboarding — the app is designed to be simple enough for one training session.",
  },
  {
    question: "Can community health workers use it on basic phones?",
    answer:
      "Yes. The field reporting app is a progressive web app that works on any Android device with a browser. It's optimized for low-bandwidth environments and functions fully offline. No app store download required.",
  },
  {
    question: "What does pricing look like?",
    answer:
      "We price per clinic per month. Pricing scales with district size — larger districts get volume discounts. Every plan includes the district console, field app, public finder, audit trail, and DHIS2 integration. Contact us for a quote tailored to your province.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-clinics-primary">
          FAQ
        </p>
        <h2
          className="mx-auto mb-12 max-w-[500px] text-center font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Questions from district health teams
        </h2>

        <div className="divide-y divide-neutral-200 border-t border-neutral-200">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-clinics-primary"
              >
                <span className="text-[15px] font-medium text-neutral-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-neutral-400 transition-transform duration-200",
                    openIndex === i && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid overflow-hidden transition-all duration-200",
                  openIndex === i ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
