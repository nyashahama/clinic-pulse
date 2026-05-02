"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Building2, ClipboardCheck, Globe2, Landmark, Radio, ShieldCheck } from "lucide-react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { demoImages } from "@/lib/demo/images";

const stakeholders = [
  { label: "District health office", icon: Landmark, detail: "status visibility" },
  { label: "NGO field team", icon: Building2, detail: "offline reporting" },
  { label: "Clinic coordinator", icon: ClipboardCheck, detail: "source confirmation" },
  { label: "Public finder", icon: Globe2, detail: "safe rerouting" },
] as const;

const liveSignals = [
  "Mamelodi East Community Clinic / stockout alert",
  "Soshanguve Block F Clinic / staffing pressure",
  "Akasia Hills Clinic / accepting reroutes",
  "Offline report queued / awaiting sync",
  "Audit event attached / district console",
] as const;

export function ProofStrip() {
  return (
    <section className="border-y border-[#d4dee1] bg-[#eef3f2]">
      <MaxWidthWrapper className="py-10">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {stakeholders.map((stakeholder) => {
              const Icon = stakeholder.icon;

              return (
                <div
                  key={stakeholder.label}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-neutral-950 text-white">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        {stakeholder.label}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">{stakeholder.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 text-white">
            <div className="grid grid-cols-[0.85fr_1.15fr]">
              <div className="relative min-h-52">
                <Image
                  src={demoImages["district-operations-room"].src}
                  alt={demoImages["district-operations-room"].alt}
                  fill
                  sizes="(min-width: 1024px) 22rem, 100vw"
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-950" />
              </div>
              <div className="relative min-h-52 overflow-hidden p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-emerald-300">
                      Live demo signal
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      Demo data, real workflow objects
                    </p>
                  </div>
                  <Radio className="size-5 text-emerald-300" />
                </div>

                <div className="mt-5 h-32 overflow-hidden">
                  <motion.div
                    animate={{ y: ["0%", "-50%"] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="grid gap-2"
                  >
                    {[...liveSignals, ...liveSignals].map((signal, index) => (
                      <div
                        key={`${signal}-${index}`}
                        className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75"
                      >
                        <ShieldCheck className="size-3.5 text-emerald-300" />
                        {signal}
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
