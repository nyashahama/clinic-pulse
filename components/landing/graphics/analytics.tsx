"use client";

import { motion } from "motion/react";

const STATS = [
  { label: "Total Clicks", value: "154K", change: "+12%", color: "text-green-600" },
  { label: "Leads", value: "9.7K", change: "+8%", color: "text-blue-600" },
  { label: "Sales", value: "$48K", change: "+24%", color: "text-green-600" },
];

const data = [
  { month: "Jan", value: 30 },
  { month: "Feb", value: 45 },
  { month: "Mar", value: 35 },
  { month: "Apr", value: 60 },
  { month: "May", value: 55 },
  { month: "Jun", value: 75 },
];

export function AnalyticsGraphic() {
  const maxValue = Math.max(...data.map((d) => d.value));
  const maxHeight = 80;

  return (
    <div className="relative size-full overflow-hidden rounded-lg bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-600">
          Last 30 days
        </span>
        <span className="flex items-center gap-1 text-[10px] text-green-600">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-1.5 w-1.5 rounded-full bg-green-500"
          />
          Live
        </span>
      </div>

      <div className="flex h-24 items-end justify-between gap-2">
        {data.map((item, i) => (
          <motion.div
            key={item.month}
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / maxValue) * maxHeight}px` }}
            transition={{
              delay: i * 0.1,
              duration: 0.5,
              ease: "easeOut",
            }}
            className="relative flex-1 rounded-t bg-gradient-to-t from-[#0D7A6B] to-[#0FA89A]"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-medium text-neutral-600">
              {item.value}%
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[9px] text-neutral-400">
        {data.map((item) => (
          <span key={item.month}>{item.month}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="text-center"
          >
            <div className={`text-sm font-semibold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-[9px] text-neutral-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}