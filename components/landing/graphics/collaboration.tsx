"use client";

import { motion } from "motion/react";

interface Props {
  className?: string;
}

export function CollaborationGraphic({ className }: Props) {
  const people = [
    { name: "Dr. Thandi M", role: "District Manager" },
    { name: "Sipho N", role: "Field Lead" },
    { name: "Naledi V", role: "Program Director" },
    { name: "Dr. Ahmed K", role: "Clinician" },
    { name: "Maria S", role: "Data Analyst" },
    { name: "John D", role: "IT Support" },
  ];

  return (
    <div
      className={`size-full [mask-image:linear-gradient(black_50%,transparent)] ${className}`}
      aria-hidden
    >
      <div className="relative h-full rounded-t-2xl border-x-2 border-t-2 border-[#0D7A6B] bg-white/70 p-4">
        <div className="absolute -top-px left-1/2 flex h-6 -translate-x-1/2 -translate-y-1/2">
          <div className="-mx-px flex h-full items-center bg-[#0D7A6B] px-3 font-mono text-xs font-medium tracking-wide text-white">
            Team Access
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {people.map((person, i) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D7A6B]/10 text-xs font-bold text-[#0D7A6B]">
                {person.name.charAt(0)}
              </div>
              <span className="text-[9px] font-medium text-neutral-700 truncate w-full text-center">
                {person.name}
              </span>
              <span className="text-[8px] text-neutral-400">{person.role}</span>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 p-2"
          >
            <span className="text-[8px] text-neutral-400">+ Invite</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-3 flex items-center justify-between rounded bg-neutral-100 px-3 py-2"
        >
          <span className="text-[10px] text-neutral-600">Permission Level</span>
          <span className="rounded bg-[#0D7A6B]/10 px-2 py-0.5 text-[9px] font-medium text-[#0D7A6B]">
            Admin
          </span>
        </motion.div>
      </div>
    </div>
  );
}