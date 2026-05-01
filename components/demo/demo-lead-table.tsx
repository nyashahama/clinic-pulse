"use client";

import { CalendarDays, Mail, MessageCircleMore, UserRound } from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import type { DemoLead } from "@/lib/demo/types";

type DemoLeadTableProps = {
  leads: DemoLead[];
  onLeadStatusChange?: (leadId: string, status: DemoLead["status"]) => void;
};

const statusStyles: Record<
  DemoLead["status"],
  { label: string; className: string; dot: string }
> = {
  new: {
    label: "New",
    className:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
    dot: "bg-sky-500",
  },
  contacted: {
    label: "Contacted",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    className:
      "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
    dot: "bg-slate-500",
  },
};

const leadStatusOptions: DemoLead["status"][] = ["new", "contacted", "scheduled", "completed"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function trimNote(value: string) {
  return value.length > 110 ? `${value.slice(0, 107)}…` : value;
}

export function DemoLeadTable({ leads, onLeadStatusChange }: DemoLeadTableProps) {
  if (leads.length === 0) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <SectionHeader
          eyebrow="Founder pipeline"
          title="Demo leads"
          description="No demo booking submissions yet. Share `/book-demo` and leads will appear here live."
        />

        <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-subtle px-4 py-8 text-sm text-content-subtle">
          Capture demo requests and tag them to the right next-step status.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default shadow-sm">
      <div className="px-4 pt-4">
        <SectionHeader
          eyebrow="Founder pipeline"
          title="Demo leads"
          description="Inbound booking interest from /book-demo with quick status controls."
        />
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        <table className="min-w-[86rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-content-subtle">
              {["Name", "Email", "Organization", "Role", "Interest", "Note", "Created", "Status"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="border-b border-border-subtle px-3 py-3 font-medium whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => {
              const tone = statusStyles[lead.status];

              return (
                <tr key={lead.id} className="align-top">
                  <td className="border-b border-border-subtle px-3 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-content-emphasis">
                      <UserRound className="size-3.5 text-content-subtle" />
                      {lead.name}
                    </div>
                  </td>

                  <td className="max-w-64 border-b border-border-subtle px-3 py-3">
                    <a
                      href={`mailto:${lead.workEmail}`}
                      className="inline-flex items-center gap-1.5 text-content-emphasis hover:underline"
                    >
                      <Mail className="size-3.5 text-content-subtle" />
                      {lead.workEmail}
                    </a>
                  </td>

                  <td className="border-b border-border-subtle px-3 py-3 text-content-default">
                    {lead.organization}
                  </td>

                  <td className="border-b border-border-subtle px-3 py-3 text-content-default">
                    {lead.role}
                  </td>

                  <td className="border-b border-border-subtle px-3 py-3 capitalize text-content-default">
                    {lead.interest.replaceAll("_", " ")}
                  </td>

                  <td className="max-w-80 border-b border-border-subtle px-3 py-3 text-content-default">
                    <div className="inline-flex gap-1.5">
                      <MessageCircleMore className="mt-0.5 size-3.5 text-content-subtle" />
                      <span className="leading-6">{trimNote(lead.note)}</span>
                    </div>
                  </td>

                  <td className="border-b border-border-subtle px-3 py-3 font-mono text-xs text-content-subtle">
                    <div className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDate(lead.createdAt)}
                    </div>
                  </td>

                  <td className="border-b border-border-subtle px-3 py-3">
                    <select
                      value={lead.status}
                      onChange={(event) => {
                        onLeadStatusChange?.(
                          lead.id,
                          event.target.value as DemoLead["status"],
                        );
                      }}
                      className="w-full rounded-lg border border-border-subtle bg-bg-subtle px-2 py-1 text-xs outline-none"
                      aria-label={`Update status for ${lead.name}`}
                    >
                      {leadStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusStyles[status].label}
                        </option>
                      ))}
                    </select>

                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${tone.className}`}
                    >
                      <span className={`inline-block size-2 rounded-full ${tone.dot}`} />
                      {tone.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
