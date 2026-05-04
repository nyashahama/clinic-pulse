import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { demoImages } from "@/lib/demo/images";
import { operatingGap } from "@/lib/landing/openpanel-refactor-content";

export function OperatingGap() {
  return (
    <LandingSection id="problem">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <LandingSectionHeader
          eyebrow={operatingGap.label}
          title={operatingGap.title}
          description={operatingGap.description}
        />

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative aspect-[16/8]">
            <Image
              src={demoImages["district-operations-room"].src}
              alt={demoImages["district-operations-room"].alt}
              fill
              sizes="(min-width: 1024px) 44rem, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <StatusList title="Before" tone="before" items={operatingGap.before} />
            <StatusList
              title="With Clinic Pulse"
              tone="after"
              items={operatingGap.after}
            />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

function StatusList({
  items,
  title,
  tone,
}: {
  items: readonly string[];
  title: string;
  tone: "before" | "after";
}) {
  const Icon = tone === "before" ? XCircle : CheckCircle2;

  return (
    <div
      className={
        tone === "before"
          ? "border-t border-neutral-200 p-5 md:border-r"
          : "border-t border-neutral-200 bg-white p-5"
      }
    >
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6 text-neutral-700">
            <Icon
              className={
                tone === "before"
                  ? "mt-1 size-4 shrink-0 text-red-500"
                  : "mt-1 size-4 shrink-0 text-primary"
              }
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
