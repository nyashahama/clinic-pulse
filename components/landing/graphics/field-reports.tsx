"use client";

import { motion } from "motion/react";

const reports = [
  {
    clinic: "Diepsloot CHC",
    type: "Status Update",
    time: "2 min ago",
    status: "verified",
  },
  {
    clinic: "Mamelodi Clinic",
    type: "Equipment Issue",
    time: "5 min ago",
    status: "pending",
  },
  {
    clinic: "Alexandra PHC",
    type: "Staff Report",
    time: "12 min ago",
    status: "verified",
  },
  {
    clinic: "Soshanguve CHC",
    type: "Supply Alert",
    time: "18 min ago",
    status: "verified",
  },
];

const statusStyles: Record<string, string> = {
  verified: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
};

export function FieldReportsGraphic() {
  return (
    <div className="relative size-full overflow-hidden rounded-lg bg-white p-3">
      <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
        <span className="text-xs font-semibold text-neutral-700">
          Recent Reports
        </span>
        <span className="flex items-center gap-1">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-2 rounded-full bg-green-500"
          />
          <span className="text-[9px] text-neutral-400">Live</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {reports.map((report, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center justify-between rounded bg-neutral-50 p-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[9px] font-bold text-neutral-500">
                {report.clinic.charAt(0)}
              </div>
              <div>
                <div className="text-[10px] font-medium text-neutral-700">
                  {report.clinic}
                </div>
                <div className="text-[8px] text-neutral-400">
                  {report.type} · {report.time}
                </div>
              </div>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${statusStyles[report.status]}`}
            >
              {report.status}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-3 flex items-center justify-center rounded border border-dashed border-neutral-200 py-2"
      >
        <span className="text-[9px] text-neutral-400">+ Add new report</span>
      </motion.div>
    </div>
  );
}