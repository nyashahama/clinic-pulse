"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "ClinicPulse gave us real-time visibility we never had with DHIS2. We can now redirect patients before they travel to a closed clinic.",
    author: "Dr. Thandi Mkhize",
    role: "District Health Manager",
    org: "Gauteng Province",
  },
  {
    quote: "The offline field reports changed how our community health workers operate. No more paper forms that take weeks to reach headquarters.",
    author: "Sipho Ndaba",
    role: "Field Operations Lead",
    org: "Right to Care",
  },
  {
    quote: "Finally, a single source of truth for clinic status. The district console replaced three spreadsheets and a WhatsApp group.",
    author: "Naledi van der Merwe",
    role: "Program Director",
    org: "BroadReach Health",
  },
];

export function SocialProofSection() {
  return (
    <section className="border-t border-neutral-200 bg-white" id="proof">
      <div className="mx-auto max-w-[1200px] border-x border-neutral-200 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          Testimonials
        </p>
        <h2
          className="mx-auto mb-12 max-w-[600px] text-center font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Trusted by the people on the ground
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.4,
                ease: "easeOut",
              }}
              className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <p
                className="mb-4 text-[15px] leading-relaxed text-neutral-600"
                style={{ textWrap: "pretty" }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-neutral-100 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D7A6B]/10 text-sm font-semibold text-[#0D7A6B]">
                  {testimonial.author.charAt(0)}
                  {testimonial.author.split(" ").pop()?.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {testimonial.author}
                  </div>
                  <div className="text-[12px] text-neutral-500">
                    {testimonial.role}, {testimonial.org}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}