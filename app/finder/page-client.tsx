"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Compass, Search } from "lucide-react";

import { ClinicFinder } from "@/components/demo/clinic-finder";
import { SectionHeader } from "@/components/demo/section-header";
import { buttonVariants } from "@/components/ui/button";
import type { ClinicRow } from "@/lib/demo/types";

type FinderPageClientProps = {
  clinics: ClinicRow[];
};

function normalize(value: string | null) {
  return value?.trim() ?? "";
}

export default function FinderPageClient({ clinics }: FinderPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = normalize(searchParams.get("query"));
  const service = normalize(searchParams.get("service"));
  const status = normalize(searchParams.get("status"));

  return (
    <main className="min-h-screen bg-bg-muted px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4">
        <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <SectionHeader
            eyebrow="Public tool"
            title="Clinic finder"
            description="Search without an account to locate a nearby clinic and get reroute options when a facility is not routing-safe."
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href="/demo" className={buttonVariants({ size: "sm", variant: "outline" })}>
              <Compass className="size-3.5" />
              Return to console
            </Link>

            <Link href="/book-demo" className={buttonVariants({ size: "sm", variant: "outline" })}>
              <CalendarClock className="size-3.5" />
              Book founder walkthrough
            </Link>
          </div>

          <div className="mt-4 rounded-lg border border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            <div className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>
                Current query:{" "}
                <span className="font-medium text-content-emphasis">{query || "all"}</span> ·
                service:{" "}
                <span className="font-medium text-content-emphasis">{service || "all"}</span> ·
                status:{" "}
                <span className="font-medium text-content-emphasis">{status || "all"}</span>
              </span>
            </div>
          </div>
        </section>

        <ClinicFinder
          clinics={clinics}
          query={query}
          service={service}
          status={status}
          onNavigateToDetail={(clinicId) => router.push(`/clinics/${clinicId}`)}
        />
      </div>
    </main>
  );
}
