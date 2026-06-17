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
      className="relative flex-1 overflow-y-auto p-8 lg:p-10"
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        }}
        className="mb-5 text-sm leading-6 text-emerald-100/60"
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
            className={`rounded-lg border-l-2 ${clinic.accentColor} ${clinic.bgColor} p-4 transition-all hover:bg-white/10 dark:border-white/10`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                  {clinic.name}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-emerald-100/50">
                  {clinic.detail}
                </p>
              </div>
              <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${clinic.textColor} dark:text-white`}>
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
            className="rounded-lg bg-white/5 p-3 text-center backdrop-blur-sm"
          >
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/50">
              {label}
            </p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
