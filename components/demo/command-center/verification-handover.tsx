import type { DistrictCommandCenter } from "@/lib/demo/district-command-center";

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
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          No handover items are required right now.
        </p>
      ) : (
        <ol className="space-y-3">
          {handover.items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </li>
          ))}
        </ol>
      )}
    </CommandCard>
  );
}
