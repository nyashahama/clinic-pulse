"use client";

import Link from "next/link";
import { CalendarClock, MessageSquare, MessageSquareQuote, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { DemoLeadForm } from "@/components/demo/demo-lead-form";
import { MetricTile } from "@/components/demo/metric-tile";
import { SectionHeader } from "@/components/demo/section-header";
import { buttonVariants } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";

export default function BookDemoPage() {
  const router = useRouter();
  const { state, addDemoLead } = useDemoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leadsTotal = state.leads.length;
  const activeLeadCount = state.leads.filter((lead) => lead.status !== "completed").length;

  const handleSubmit = (lead: DemoLeadFormInput) => {
    setIsSubmitting(true);

    addDemoLead({
      ...lead,
      createdAt: new Date().toISOString(),
      status: "new",
    });

    router.push(
      `/book-demo/thanks?name=${encodeURIComponent(lead.name)}&organization=${encodeURIComponent(
        lead.organization,
      )}`,
    );
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 pb-4 px-3 py-4 lg:px-6">
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm lg:p-5">
        <SectionHeader
          eyebrow="Founder demo"
          title="Request a founder walkthrough"
          description="Capture lead context before sharing your full product demonstration flow."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Demo requests"
            count={leadsTotal}
            description="Current inbound founder demo interest."
            trend={{
              value: `${activeLeadCount} active`,
              direction: leadsTotal > 0 ? "up" : "flat",
              context: "New requests flow into /admin immediately.",
            }}
          />
          <MetricTile
            label="Demo setup"
            count={1}
            description="No signup required; this route is purpose-built for pitching."
            trend={{
              value: "live",
              direction: "up",
              context: "One clean link in your outreach materials.",
            }}
          />
          <MetricTile
            label="Route safety"
            count={state.offlineQueue.length}
            description="Offline reports waiting until the next field sync."
            trend={{
              value: "demo",
              direction: state.offlineQueue.length > 0 ? "down" : "flat",
              context: "Keeps your field demo resilient under flaky networks.",
            }}
          />
          <MetricTile
            label="Public touchpoint"
            count={state.alerts.length}
            description="Open alerts visible on the finder and console surfaces."
            trend={{
              value: "ready",
              direction: state.alerts.some((alert) => alert.status === "open") ? "down" : "up",
              context: "All alert semantics are traceable by demo timestamp.",
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/demo" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <CalendarClock className="size-3.5" />
            Open district console
          </Link>

          <Link href="/finder" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <MessageSquare className="size-3.5" />
            Open finder experience
          </Link>

          <Link href="/field" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <MessageSquareQuote className="size-3.5" />
            Open field flow
          </Link>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <DemoLeadForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Submit founder walkthrough request"
        />

        <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
          <SectionHeader
            eyebrow="What happens next"
            title="Founder handoff path"
            description="Keep this tight for a better demo conversation and conversion rhythm."
          />

          <div className="mt-4 grid gap-3 rounded-lg border border-border-subtle bg-bg-subtle p-3 text-sm text-content-default">
            <p>1) Submit this page after each warm lead conversation.</p>
            <p>2) Check admin for lead status and next-best demo touchpoint.</p>
            <p>3) Start /demo and walk from live district operations into finder and field flows.</p>
            <p>4) End with export/API package for a cleaner founder-facing handoff.</p>
          </div>

          <div className="mt-4 rounded-md border border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
            <p className="flex items-center gap-1.5 text-content-emphasis">
              <ShieldCheck className="size-3.5" />
              Lead intake is stored in browser state and also shown inside /admin controls.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
