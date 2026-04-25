"use client";

import { motion } from "motion/react";

interface Props {
  className?: string;
}

const domains = [
  { domain: "clinicpulse.org", clicks: "15.6K", primary: true },
  { domain: "clinicpulse.health", clicks: "3.7K" },
  { domain: "clinicpulse.co.za", clicks: "2.4K" },
];

export function DomainsGraphic({ className }: Props) {
  return (
    <div className={`size-full flex flex-col justify-center ${className}`} aria-hidden>
      <div className="flex flex-col gap-3 [mask-image:linear-gradient(90deg,black_80%,transparent)]">
        {domains.map(({ domain, clicks, primary }, idx) => (
          <motion.div
            key={domain}
            transition={{ duration: 0.3 }}
            className="transition-transform hover:translate-x-[-2%]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="flex cursor-default items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
              style={{ marginLeft: `${(idx + 1) * 5}%` }}
            >
              <div className="flex-none rounded-full border border-neutral-200 bg-gradient-to-t from-neutral-100 p-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-[#0D7A6B]">
                  <span className="text-white text-[8px] font-bold">C</span>
                </div>
              </div>

              <span className="text-sm font-medium text-neutral-900">
                {domain}
              </span>

              <div className="ml-2 flex items-center gap-x-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1">
                <span className="text-xs text-neutral-500">{clicks}</span>
                <span className="hidden text-xs text-neutral-500 sm:inline-block">
                  clicks
                </span>
              </div>

              {primary && (
                <div className="flex items-center gap-x-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1">
                  <span className="text-xs text-blue-600">Primary</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 flex justify-center"
        >
          <button className="flex items-center gap-1 text-xs font-medium text-[#0D7A6B] hover:underline">
            + Add custom domain
          </button>
        </motion.div>
      </div>
    </div>
  );
}