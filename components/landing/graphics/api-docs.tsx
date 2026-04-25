"use client";

import { motion } from "motion/react";

const endpoints = [
  { method: "GET", path: "/api/clinics", status: 200, time: "45ms" },
  { method: "POST", path: "/api/reports", status: 201, time: "120ms" },
  { method: "GET", path: "/api/status/:id", status: 200, time: "32ms" },
];

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

export function APIDocumentationGraphic() {
  return (
    <div className="relative size-full overflow-hidden rounded-lg bg-neutral-900 p-4 font-mono">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-green-500">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-xs font-medium text-white">ClinicPulse API</span>
        <span className="ml-auto text-[9px] text-neutral-500">v1.0</span>
      </div>

      <div className="space-y-2">
        {endpoints.map((endpoint, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-2 rounded bg-neutral-800 p-2"
          >
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${methodColors[endpoint.method]}`}
            >
              {endpoint.method}
            </span>
            <span className="flex-1 text-[9px] text-neutral-300">
              {endpoint.path}
            </span>
            <span className="text-[9px] text-green-400">{endpoint.status}</span>
            <span className="text-[9px] text-neutral-500">{endpoint.time}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-3 rounded border border-neutral-700 bg-neutral-800/50 p-2"
      >
        <div className="mb-1 text-[9px] text-neutral-500">Response</div>
        <pre className="text-[8px] text-green-400">
{`{
  "id": "clinic-001",
  "status": "operational",
  "lastUpdated": "2026-04-24T10:30:00Z"
}`}
        </pre>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-3 right-3 flex items-center gap-1 text-[9px] text-neutral-500"
      >
        <span className="h-1.5 w-1.5 animate-pulse-grow rounded-full bg-green-500" />
        Rate limit: 1k/min
      </motion.div>
    </div>
  );
}