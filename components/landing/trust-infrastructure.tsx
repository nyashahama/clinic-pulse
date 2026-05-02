"use client";

import { motion } from "motion/react";
import { Braces, FileDown, KeyRound, Radio, ShieldCheck, UserCheck, WifiOff } from "lucide-react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { roadmapModules } from "./landing-scenario-data";

const auditRows = [
  "report.received_offline / Sipho Nkosi / queued locally",
  "report.synced / field_worker / connectivity restored",
  "clinic.status_changed / Mamelodi East / non-functional",
  "alert.created / stockout / critical",
  "routing.alternative_recommended / Akasia Hills Clinic",
] as const;

const trustObjects = [
  { label: "Freshness", value: "Fresh - 2 min ago", icon: Radio },
  { label: "Offline queue", value: "3 reports queued", icon: WifiOff },
  { label: "Permissions", value: "District manager", icon: KeyRound },
  { label: "Source", value: "Field worker", icon: UserCheck },
] as const;

export function TrustInfrastructure() {
  return (
    <section id="trust" className="border-y border-[#d4dee1] bg-[#eef3f2]">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0D7A6B]">
              Trust and infrastructure
            </p>
            <h2
              className="mt-4 font-display text-3xl font-medium leading-[1.12] text-neutral-950 sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Public-sector trust comes from records, not claims.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              Every operational decision needs source, freshness, permissions,
              export path, and audit history.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {trustObjects.map((object) => {
                const Icon = object.icon;

                return (
                  <div key={object.label} className="rounded-md border border-neutral-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
                      <Icon className="size-4 text-primary" />
                      {object.label}
                    </div>
                    <p className="mt-2 font-mono text-sm font-semibold text-neutral-950">
                      {object.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-300" />
                  <p className="text-sm font-semibold">Audit ledger</p>
                </div>
                <p className="font-mono text-xs text-white/40">immutable trail</p>
              </div>
              <div className="h-72 overflow-hidden p-4">
                <motion.div
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                  className="grid gap-2"
                >
                  {[...auditRows, ...auditRows].map((row, index) => (
                    <div
                      key={`${row}-${index}`}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs leading-5 text-white/70"
                    >
                      {row}
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  <FileDown className="size-4 text-primary" />
                  District export
                </div>
                <div className="mt-3 rounded-md bg-neutral-950 p-3 font-mono text-xs leading-6 text-emerald-200">
                  CSV / incident_report / clinic_status
                  <br />
                  district=Tshwane North Demo
                  <br />
                  freshness=required
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  <Braces className="size-4 text-primary" />
                  API preview
                </div>
                <div className="mt-3 rounded-md bg-neutral-950 p-3 font-mono text-xs leading-6 text-sky-200">
                  GET /clinics/status
                  <br />
                  status: non_functional
                  <br />
                  source: field_worker
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {roadmapModules.map((module) => (
            <div
              key={module}
              className="rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-xs text-neutral-700"
            >
              {module}
            </div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
