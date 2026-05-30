import type { DistrictCommandCenter } from "@/lib/workspace/district-command-center";

import { CommandCard } from "./command-card";

type VerificationHandoverProps = {
  handover: DistrictCommandCenter["handover"];
};

export function VerificationHandover({ handover }: VerificationHandoverProps) {
  return (
    <CommandCard
      eyebrow="Verification and handover"
      title={handover.title}
      description="Concise shift handover notes so the next operator can verify outcomes without rereading the full queue."
    >
      {handover.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
          No handover items are required right now.
        </p>
      ) : (
        <ol className="space-y-3">
          {handover.items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-muted-foreground">{item}</p>
            </li>
          ))}
        </ol>
      )}
    </CommandCard>
  );
}
