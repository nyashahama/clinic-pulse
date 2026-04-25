"use client";

import { motion } from "motion/react";

const dots = [
  { x: 15, y: 20, status: "operational" },
  { x: 25, y: 35, status: "operational" },
  { x: 35, y: 25, status: "operational" },
  { x: 45, y: 40, status: "degraded" },
  { x: 55, y: 30, status: "operational" },
  { x: 65, y: 45, status: "operational" },
  { x: 75, y: 25, status: "non-functional" },
  { x: 85, y: 35, status: "operational" },
  { x: 20, y: 55, status: "operational" },
  { x: 30, y: 65, status: "operational" },
  { x: 40, y: 50, status: "degraded" },
  { x: 50, y: 60, status: "operational" },
  { x: 60, y: 70, status: "operational" },
  { x: 70, y: 55, status: "operational" },
  { x: 80, y: 65, status: "operational" },
];

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  degraded: "bg-amber-500",
  "non-functional": "bg-red-500",
};

export function StatusMapGraphic() {
  return (
    <div className="relative size-full overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: i * 0.05,
            duration: 0.3,
            ease: "easeOut",
          }}
          className={`absolute rounded-full ${statusColors[dot.status]} ${
            dot.status === "non-functional" ? "h-2.5 w-2.5" : "h-2 w-2"
          }`}
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            boxShadow: `0 0 8px ${
              dot.status === "operational"
                ? "rgba(34,197,94,0.4)"
                : dot.status === "degraded"
                ? "rgba(245,158,11,0.4)"
                : "rgba(239,68,68,0.4)"
            }`,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-3 left-3 right-3 flex justify-between text-[9px] font-medium text-neutral-400"
      >
        <span>254 active</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Operational
        </span>
      </motion.div>
    </div>
  );
}