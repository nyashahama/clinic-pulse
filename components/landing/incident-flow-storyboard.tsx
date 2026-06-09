import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  Radio,
  Route,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/landing-section";
import { landingPhotos } from "@/components/landing/photo-assets";
import { cn } from "@/lib/utils";

type TimelineVariant = "amber" | "red" | "green" | "neutral" | "blue";

interface TimelineEvent {
  time: string;
  date: string;
  title: string;
  detail: string;
  surface: string;
  icon: LucideIcon;
  dotColor: string;
  ringColor: string;
  assignee: { name: string; initials: string };
  status: { label: string; variant: TimelineVariant };
}

const timelineEvents: TimelineEvent[] = [
  {
    time: "07:12",
    date: "Today",
    title: "Offline field report queued",
    detail: "Community health worker submitted pharmacy closure report from Mabopane Station. No signal — saved locally.",
    surface: "Field report",
    icon: Radio,
    dotColor: "bg-amber-500",
    ringColor: "ring-amber-200",
    assignee: { name: "S. Ndaba", initials: "SN" },
    status: { label: "Synced", variant: "amber" },
  },
  {
    time: "07:14",
    date: "Today",
    title: "District status updated to non-functional",
    detail: "Generator failure confirmed. Pharmacy and chronic care pickup paused. 83 patients affected.",
    surface: "District console",
    icon: AlertTriangle,
    dotColor: "bg-red-500",
    ringColor: "ring-red-200",
    assignee: { name: "System", initials: "SY" },
    status: { label: "Critical", variant: "red" },
  },
  {
    time: "07:15",
    date: "Today",
    title: "Patient reroute triggered",
    detail: "Akasia Hills Clinic identified as nearest compatible alternative for pharmacy services. Public finder updated.",
    surface: "Public finder",
    icon: Route,
    dotColor: "bg-emerald-500",
    ringColor: "ring-emerald-200",
    assignee: { name: "System", initials: "SY" },
    status: { label: "18 min saved", variant: "green" },
  },
  {
    time: "07:16",
    date: "Today",
    title: "Audit record sealed",
    detail: "Source report, status change, reroute decision, and affected patient count linked. Record immutable.",
    surface: "Audit ledger",
    icon: ShieldCheck,
    dotColor: "bg-neutral-400",
    ringColor: "ring-neutral-200",
    assignee: { name: "System", initials: "SY" },
    status: { label: "AUD-OPS-MAB-001", variant: "neutral" },
  },
  {
    time: "08:01",
    date: "Today",
    title: "Field follow-up submitted",
    detail: "District manager verified generator repair ETA. Estimated restoration by 14:00.",
    surface: "Field report",
    icon: FileText,
    dotColor: "bg-blue-500",
    ringColor: "ring-blue-200",
    assignee: { name: "T. Mkhize", initials: "TM" },
    status: { label: "Update", variant: "blue" },
  },
];

const statusStyles: Record<TimelineVariant, string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
  red: "bg-red-50 text-red-700 ring-red-600/10",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  neutral: "bg-neutral-100 text-neutral-600 ring-neutral-500/10",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
};

export function IncidentFlowStoryboard() {
  const fieldWorkerPhoto = landingPhotos.fieldWorker;

  return (
    <LandingSection id="flow" className="border-y border-neutral-200 bg-neutral-50 dark:border-border dark:bg-background">
      <div className="grid gap-10">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <LandingSectionHeader
            eyebrow="Incident flow"
            title="From field signal to operating record."
            description="One availability incident moves from an offline field report to the district console, patient reroute, and sealed audit trail without splitting the source record."
          />
          <div className="relative min-h-64 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-border dark:bg-muted lg:min-h-80">
            <Image
              src={fieldWorkerPhoto.src}
              alt={fieldWorkerPhoto.alt}
              fill
              sizes="(min-width: 1280px) 712px, (min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              style={{ objectPosition: fieldWorkerPhoto.position }}
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/30 bg-neutral-950/78 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/68">
                Field source
              </p>
              <p className="mt-1 text-sm font-semibold">
                Offline report keeps the incident source attached.
              </p>
            </div>
          </div>
        </div>

        {/* Incident timeline */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-border dark:bg-card">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-neutral-950 dark:text-card-foreground">
                  Mabopane Station — incident timeline
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Active
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-500 dark:text-muted-foreground">
                AUD-OPS-MAB-001
              </p>
            </div>
          </div>

          <div className="relative">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              const isLast = index === timelineEvents.length - 1;

              return (
                <div key={index} className="relative flex gap-4 px-5 py-4">
                  {/* Rail + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4",
                        event.dotColor,
                        event.ringColor,
                      )}
                    >
                      <Icon className="size-3.5 text-white" />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-neutral-200 dark:bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-neutral-950 dark:text-card-foreground">
                        {event.title}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          statusStyles[event.status.variant],
                        )}
                      >
                        {event.status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-muted-foreground">
                      {event.detail}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-500 dark:text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {event.date} {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {event.surface}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {event.assignee.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
