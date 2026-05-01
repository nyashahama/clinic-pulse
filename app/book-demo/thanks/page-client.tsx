"use client";

import Link from "next/link";
import { CheckCircle2, Compass, Sparkles, TicketCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { SectionHeader } from "@/components/demo/section-header";
import { buttonVariants } from "@/components/ui/button";

function getParam(params: URLSearchParams, key: string) {
  return params.get(key) ?? "";
}

export default function BookDemoThanksPage() {
  const searchParams = useSearchParams();
  const name = getParam(searchParams, "name");
  const organization = getParam(searchParams, "organization");

  const greeting = name ? `Thanks, ${name}` : "Thanks for booking";

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 px-3 py-8 lg:px-6">
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Request received"
          title={greeting}
          description="Your founder walkthrough request has been captured in this demo environment."
        />

        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-5" />
            <div>
              <p className="font-medium">
                Demo booking created successfully.
                {organization ? ` Your team from ${organization} will be routed to admin lead follow-up.` : ""}
              </p>
              <p className="mt-2 text-sm leading-6">
                You can now continue to the product surfaces and keep momentum: district console,
                finder, field reporting, and admin handoff are all live in one flow.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/demo" className={buttonVariants({ size: "sm", variant: "default" })}>
            <Sparkles className="size-3.5" />
            Continue to district console
          </Link>

          <Link href="/admin" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <TicketCheck className="size-3.5" />
            Open admin handoff
          </Link>

          <Link href="/finder" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <Compass className="size-3.5" />
            Explore clinic finder
          </Link>
        </div>
      </section>
    </div>
  );
}
