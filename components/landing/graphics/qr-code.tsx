"use client";

import { motion } from "motion/react";
import { useState } from "react";

interface Props {
  className?: string;
}

export function QRCodeGraphic({ className }: Props) {
  const [hideLogo, setHideLogo] = useState(false);

  return (
    <div className={`size-full [mask-image:linear-gradient(black_70%,transparent)] ${className}`}>
      <div className="mx-2 flex origin-top scale-95 cursor-default flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_10px_10px_0_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">QR Code Design</h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-white">
            <div className="grid grid-cols-5 gap-0.5 p-1">
              {[
                [1, 0, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
                [0, 0, 1, 0, 1],
                [1, 1, 0, 1, 1],
              ].map((row, ri) =>
                row.map((cell, ci) => (
                  <motion.div
                    key={`${ri}-${ci}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: ri * 0.1 + ci * 0.05 }}
                    className={`h-3 w-3 ${cell ? "bg-neutral-900" : "bg-white"}`}
                  />
                ))
              )}
            </div>
            {!hideLogo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded bg-[#0D7A6B]/10 p-1">
                  <div className="flex h-full w-full items-center justify-center rounded bg-[#0D7A6B]">
                    <span className="text-white text-[8px] font-bold">CP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between rounded border border-neutral-200 px-2 py-1.5">
              <span className="text-[10px] text-neutral-500">Color</span>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-[#0D7A6B]" />
                <span className="text-[9px] text-neutral-700">Primary</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded border border-neutral-200 px-2 py-1.5">
              <span className="text-[10px] text-neutral-500">Logo</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setHideLogo(!hideLogo)}
                className="text-[9px] text-neutral-700 underline"
              >
                {hideLogo ? "Show" : "Hide"}
              </motion.button>
            </div>

            <div className="flex items-center justify-between rounded border border-neutral-200 px-2 py-1.5">
              <span className="text-[10px] text-neutral-500">Size</span>
              <span className="text-[9px] text-neutral-700">512px</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="rounded bg-neutral-100 px-3 py-1 text-[9px] text-neutral-600">
            Download
          </button>
          <button className="rounded bg-neutral-900 px-3 py-1 text-[9px] text-white">
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
}