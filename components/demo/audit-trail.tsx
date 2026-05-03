import { RefreshCw, UserRound, Workflow, type LucideIcon } from "lucide-react";

import type { AuditEvent } from "@/lib/demo/types";

type AuditTrailProps = {
  clinicName: string;
  events: AuditEvent[];
};

type SystemResponseTone = {
  title: string;
  action: string;
  icon: LucideIcon;
};

const systemResponseByType: Record<AuditEvent["eventType"], SystemResponseTone> = {
  "demo.reset": {
    title: "Demo reset",
    action: "All clinics, alerts, and pending reports were restored to seeded baseline.",
    icon: RefreshCw,
  },
  "demo.stockout_triggered": {
    title: "Stockout simulation",
    action: "Stockout alert created and clinic status feed was rewritten for routing decisions.",
    icon: Workflow,
  },
  "demo.staffing_shortage_triggered": {
    title: "Staffing alert simulation",
    action: "Clinician staffing pressure was raised and route recommendations were updated.",
    icon: Workflow,
  },
  "demo.offline_sync_triggered": {
    title: "Offline sync simulation",
    action: "Queued field reports were inserted as synced reports and clinic freshness was recalculated.",
    icon: Workflow,
  },
  "clinic.status_changed": {
    title: "Status change",
    action:
      "Routing signals, alerts, and map/list views were refreshed to use the new operational state.",
    icon: Workflow,
  },
  "clinic.status_marked_stale": {
    title: "Stale status",
    action: "Status downgraded from confirmed to stale and routed out of direct patient flow.",
    icon: Workflow,
  },
  "report.submitted": {
    title: "Report received",
    action: "Report stream updated and clinic health summary recalculated from the new signal.",
    icon: Workflow,
  },
  "report.reviewed": {
    title: "Report reviewed",
    action: "Review decision was recorded and the audit history now links status changes to the reviewer.",
    icon: Workflow,
  },
  "report.received_offline": {
    title: "Offline report received",
    action: "Offline report was queued locally so the district surface can continue operating.",
    icon: Workflow,
  },
  "report.synced": {
    title: "Offline report synced",
    action: "Queued report was merged back into live state and became the latest clinic status.",
    icon: Workflow,
  },
  "alert.created": {
    title: "Alert created",
    action: "Alert feed was updated so operators can see escalation and mitigation guidance.",
    icon: Workflow,
  },
  "routing.alternative_recommended": {
    title: "Routing recommendation",
    action: "Alternative routing list was refreshed and surfaced in the reroute panel.",
    icon: Workflow,
  },
  "lead.demo_requested": {
    title: "Demo lead event",
    action: "Lead queue captured for founder/admin follow-up; no clinic state mutation occurred.",
    icon: Workflow,
  },
  "export.preview_opened": {
    title: "Export preview",
    action: "Demo export payload generated for review only; underlying state remains unchanged.",
    icon: Workflow,
  },
  "api.preview_opened": {
    title: "API preview",
    action: "Frontend API examples were opened without invoking a backend endpoint.",
    icon: Workflow,
  },
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatusChange(event: AuditEvent) {
  if (event.eventType === "clinic.status_changed") {
    return `${event.summary} (clinic status changed by ${event.actorName}).`;
  }

  if (event.eventType === "demo.stockout_triggered") {
    return `${event.actorName} triggered a stockout scenario for routing impact and service availability.`;
  }

  if (event.eventType === "demo.staffing_shortage_triggered") {
    return `${event.actorName} simulated staffing pressure affecting this clinic's throughput.`;
  }

  if (
    event.eventType === "report.submitted" ||
    event.eventType === "report.reviewed" ||
    event.eventType === "report.synced" ||
    event.eventType === "report.received_offline"
  ) {
    if (event.eventType === "report.reviewed") {
      return `${event.actorName} reviewed a submitted report and recorded the decision for the clinic timeline.`;
    }

    return `${event.actorName} submitted a new operating report used to update the clinic status context.`;
  }

  return event.summary;
}

export function AuditTrail({ clinicName, events }: AuditTrailProps) {
  if (events.length === 0) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-content-emphasis">Audit trail</h2>
        <p className="mt-3 text-sm text-content-subtle">
          No audit events yet for {clinicName}. Submitting or syncing a report will start the
          timeline.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-content-emphasis">Audit trail</h2>
      <p className="mt-1 text-sm text-content-subtle">
        Event chronology for status decisions and downstream system responses.
      </p>

      <div className="mt-4 space-y-3">
        {events.map((event) => {
          const response = systemResponseByType[event.eventType];
          const Icon = response.icon;

          return (
            <article
              key={event.id}
              className="rounded-lg border border-border-subtle bg-bg-subtle p-3"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-medium text-content-emphasis">
                  {event.actorName}
                </p>
                <p className="font-mono text-xs text-content-subtle">{formatTime(event.createdAt)}</p>
              </header>

              <p className="mt-2 text-sm leading-6 text-content-default">
                <span className="inline-flex items-center gap-1 text-content-subtle">
                  <UserRound className="size-3.5" />
                  Who/what changed:{" "}
                </span>
                <span className="font-medium text-content-emphasis">{event.actorName}</span>
              </p>

              <p className="mt-2 text-sm leading-6 text-content-default">
                <span className="font-medium text-content-default">What changed:</span> {formatStatusChange(event)}
              </p>

              <div className="mt-3 flex items-start gap-2 rounded-md border border-border-subtle bg-white p-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-content-subtle" />
                <p className="text-xs leading-5 text-content-subtle">
                  <span className="font-medium text-content-default">{response.title}:</span>{" "}
                  {response.action}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
