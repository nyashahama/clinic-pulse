"use client";

import { motion } from "motion/react";
import { useState } from "react";

interface Props {
  className?: string;
}

const deviceData = [
  { icon: "💻", name: "Desktop", clicks: "12.4K", percent: 65 },
  { icon: "📱", name: "Mobile", clicks: "5.2K", percent: 27 },
  { icon: "📟", name: "Tablet", clicks: "0.4K", percent: 8 },
];

const geoData = [
  { flag: "🇿🇦", country: "South Africa", clicks: "14.2K", percent: 74 },
  { flag: "🇳🇬", country: "Nigeria", clicks: "1.8K", percent: 9 },
  { flag: "🇰🇪", country: "Kenya", clicks: "0.9K", percent: 5 },
  { flag: "🇪🇹", country: "Ethiopia", clicks: "0.6K", percent: 3 },
  { flag: "🌍", country: "Other", clicks: "0.5K", percent: 9 },
];

export function PersonalizationGraphic({ className }: Props) {
  const [tab, setTab] = useState<"device">("device");

  return (
    <div className={`size-full ${className}`}>
      <div className="flex h-full flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex gap-1">
          {(["device"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-2 py-1 text-[10px] font-medium capitalize ${
                tab === t
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-1 gap-3">
          <div className="flex flex-1 flex-col gap-2">
            {deviceData.map((device, i) => (
              <motion.div
                key={device.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 rounded bg-neutral-50 p-2"
              >
                <span className="text-base">{device.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-medium">{device.name}</span>
                    <span className="text-[9px] text-neutral-500">
                      {device.percent}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.percent}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                      className="h-full rounded-full bg-[#0D7A6B]"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex-1 rounded bg-neutral-50 p-2">
            <div className="mb-2 text-[9px] font-semibold text-neutral-500">
              Top Countries
            </div>
            {geoData.slice(0, 4).map((geo, i) => (
              <motion.div
                key={geo.country}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm">{geo.flag}</span>
                <span className="text-[9px] text-neutral-600">{geo.country}</span>
                <span className="text-[9px] text-neutral-400">{geo.percent}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}