import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPinned, Search, ShieldAlert } from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { StatusBadge } from "@/components/demo/status-badge";
import { Button } from "@/components/ui/button";
import { getDemoImage } from "@/lib/demo/images";
import type { Clinic, ClinicCurrentState } from "@/lib/demo/types";

type ClinicProfileHeaderProps = {
  clinic: Clinic & ClinicCurrentState;
  onFindAlternative: () => void;
  onEscalate: () => void;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ClinicProfileHeader({
  clinic,
  onFindAlternative,
  onEscalate,
}: ClinicProfileHeaderProps) {
  const image = getDemoImage(clinic.imageKey);
  const updatedAt = formatTimestamp(clinic.lastReportedAt);
  const districtBreadcrumb = `${clinic.province} · ${clinic.district}`;

  return (
    <section className="overflow-hidden rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="relative min-h-56 sm:min-h-72">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 56rem, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur"
          >
            <ArrowRight className="size-3.5 rotate-180" />
            Back to district console
          </Link>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
              Clinic profile
            </p>
            <h1 className="text-xl font-semibold text-content-emphasis sm:text-2xl">
              {clinic.name}
            </h1>
            <p className="text-sm text-content-default">
              {clinic.facilityCode} · {districtBreadcrumb}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={clinic.status} />
              <FreshnessBadge freshness={clinic.freshness} />
              <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-subtle px-2.5 py-1 text-xs text-content-subtle">
                <MapPinned className="size-3.5" />
                Last updated {updatedAt}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button size="sm" onClick={onFindAlternative} className="justify-center">
              <Search className="size-4" />
              Find alternative
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEscalate}
              className="justify-center"
            >
              <ShieldAlert className="size-4" />
              Escalate
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
