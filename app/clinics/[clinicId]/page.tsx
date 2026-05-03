import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  Stethoscope,
} from "lucide-react";

import { FreshnessBadge } from "@/components/demo/freshness-badge";
import { StatusBadge } from "@/components/demo/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ClinicPulseApiError, fetchClinic } from "@/lib/demo/api-client";
import { mapApiClinicDetailToClinicRow } from "@/lib/demo/api-mappers";
import type { ClinicRow } from "@/lib/demo/types";

type PublicClinicDetailPageProps = {
  params: Promise<{
    clinicId: string;
  }>;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatusText(value: string) {
  return value.replaceAll("_", " ");
}

function buildFinderHref(clinic: ClinicRow) {
  const params = new URLSearchParams({ query: clinic.name });
  const firstService = clinic.services[0];

  if (firstService) {
    params.set("service", firstService);
  }

  return `/finder?${params.toString()}`;
}

async function loadPublicClinic(clinicId: string) {
  try {
    return mapApiClinicDetailToClinicRow(await fetchClinic(clinicId), {
      imageKey: "clinic-front-01",
    });
  } catch (error) {
    if (error instanceof ClinicPulseApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

export default async function PublicClinicDetailPage({ params }: PublicClinicDetailPageProps) {
  await connection();

  const { clinicId } = await params;
  const clinic = await loadPublicClinic(clinicId);

  return (
    <main className="min-h-screen bg-bg-muted px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-4">
        <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-content-subtle">
                Public clinic profile
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-content-emphasis sm:text-3xl">
                {clinic.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-content-subtle">
                <span>{clinic.facilityCode}</span>
                <span aria-hidden="true">/</span>
                <span>{clinic.district}</span>
                <span aria-hidden="true">/</span>
                <span>{clinic.province}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={clinic.status} />
              <FreshnessBadge freshness={clinic.freshness} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                <Activity className="size-3.5" />
                Status
              </div>
              <p className="mt-2 text-sm font-medium capitalize text-content-emphasis">
                {formatStatusText(clinic.status)}
              </p>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                <Clock className="size-3.5" />
                Freshness
              </div>
              <p className="mt-2 text-sm font-medium capitalize text-content-emphasis">
                {formatStatusText(clinic.freshness)}
              </p>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
                <MapPin className="size-3.5" />
                Hours
              </div>
              <p className="mt-2 text-sm font-medium text-content-emphasis">
                {clinic.operatingHours}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <div className="grid gap-4">
            <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
              <p className="text-sm font-medium text-content-emphasis">Current reason</p>
              <p className="mt-2 text-sm leading-6 text-content-default">{clinic.reason}</p>
              <p className="mt-3 text-xs text-content-subtle">
                Last updated {formatTimestamp(clinic.lastReportedAt)}
              </p>
            </section>

            <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-content-emphasis">
                <Stethoscope className="size-4 text-primary" />
                Services
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {clinic.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-border-subtle bg-bg-subtle px-3 py-1 text-xs text-content-default"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <section className="content-start rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
            <p className="text-sm font-medium text-content-emphasis">Next steps</p>
            <div className="mt-4 grid gap-2">
              <Link
                href={buildFinderHref(clinic)}
                className={buttonVariants({ size: "sm", variant: "default" })}
              >
                <ArrowLeft className="size-3.5" />
                Back to finder
              </Link>
              <Link
                href="/book-demo"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <CalendarClock className="size-3.5" />
                Book founder walkthrough
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
