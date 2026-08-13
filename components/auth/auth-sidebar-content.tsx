"use client";

import { motion } from "motion/react";

type ClinicCard = {
  name: string;
  status: string;
  detail: string;
  statusColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
};

export function AuthSidebarContent({
  clinicCards,
  stats,
  description,
}: {
  clinicCards: ClinicCard[];
  stats: [string, string][];
  description: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
      }}
      className="relative flex-1 overflow-y-auto px-0 pb-0 pt-8 lg:pt-10"
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        }}
        className="mb-5 text-sm leading-6 text-neutral-600"
      >
        {description}
      </motion.p>

      <div className="space-y-3">
        {clinicCards.map((clinic) => (
          <motion.div
            key={clinic.name}
            variants={{
              hidden: { opacity: 0, x: -12 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
            }}
            className={`rounded-xl border border-neutral-200 border-l-4 ${clinic.accentColor} ${clinic.bgColor} p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {clinic.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-600">
                  {clinic.detail}
                </p>
              </div>
              <div className={`flex shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold ${clinic.textColor}`}>
                <span className={`size-1.5 rounded-full ${clinic.statusColor}`} />
                {clinic.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        {stats.map(([value, label]) => (
          <div
            key={label}
            className="rounded-xl border border-white/80 bg-white/65 p-3 text-center shadow-sm backdrop-blur-sm"
          >
            <p className="text-base font-bold text-neutral-950">{value}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {label}
            </p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
