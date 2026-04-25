"use client";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { motion } from "motion/react";

const marks = [
  "District Health Teams",
  "NGO Networks",
  "CHW Teams",
  "NHI Readiness",
  "Open Data",
  "Field Operations",
];

export function TrustStrip() {
  return (
    <section className="border-t border-neutral-200">
      <MaxWidthWrapper className="py-10">
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
          <div className="flex animate-infinite-scroll gap-16" style={{ "--scroll": "-50%" } as React.CSSProperties}>
            {[...marks, ...marks, ...marks].map((mark, i) => (
              <div key={i} className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-neutral-400">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                {mark}
              </div>
            ))}
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-6 text-center text-sm text-neutral-400"
        >
          Built for district managers, NGOs, community health workers, and public clinic finders.
        </motion.p>
      </MaxWidthWrapper>
    </section>
  );
}
