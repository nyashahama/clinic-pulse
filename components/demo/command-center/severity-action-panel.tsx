import Link from "next/link";
import { ArrowRight, FileText, MapPin } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type {
  DistrictSeverityQueueViewModel,
  DistrictSeveritySelectedAction,
} from "@/lib/demo/district-severity-queue-view-model";
import { cn } from "@/lib/utils";

type SeverityActionPanelProps = {
  selectedItem: DistrictSeverityQueueViewModel["selectedItem"];
  selectedAction: DistrictSeveritySelectedAction | null;
};

export function SeverityActionPanel({
  selectedAction,
  selectedItem,
}: SeverityActionPanelProps) {
  if (!selectedItem || !selectedAction) {
    return (
      <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
        <p className="text-sm font-medium text-foreground">No clinic selected</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Select a queue item to review recommended action, verification need, and evidence links.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        Selected clinic action
      </p>
      <h2 className="mt-1 break-words text-lg font-semibold leading-tight text-foreground">
        {selectedItem.clinicName}
      </h2>
      <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
        {selectedAction.patientImpact}
      </p>

      <dl className="mt-4 divide-y divide-border-subtle border-y border-border-subtle">
        <ActionSummary label="Recommended action" value={selectedAction.recommendedAction} />
        <ActionSummary label="Verification need" value={selectedAction.verificationNeed} />
        <ActionSummary
          label="Alternative capacity"
          value={`${selectedAction.availableAlternatives} available alternative clinics`}
        />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link className={buttonVariants({ size: "sm" })} href={selectedAction.clinicHref}>
          <MapPin className="size-3.5" />
          Open clinic detail
        </Link>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Recent evidence
        </p>
        <div className="mt-2 grid gap-2">
          {selectedAction.reportLinks.length ? (
            selectedAction.reportLinks.map((report) => (
              <Link
                key={report.id}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-auto justify-between gap-3 whitespace-normal px-3 py-2 text-left",
                )}
                href={report.href}
              >
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium">
                    {report.label}
                  </span>
                  <span className="block break-words text-xs text-muted-foreground">
                    {report.detail}
                  </span>
                </span>
                <ArrowRight className="size-3.5 shrink-0" />
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border-subtle p-3 text-sm text-muted-foreground">
              <FileText className="mb-2 size-4" />
              No recent report evidence is attached to this clinic in the current scenario state.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ActionSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-sm leading-5 text-foreground">{value}</dd>
    </div>
  );
}
