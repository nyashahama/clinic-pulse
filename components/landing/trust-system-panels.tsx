import {
  Braces,
  FileDown,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { trustSystemPanels } from "@/lib/landing/openpanel-refactor-content";

const icons = {
  "Audit event": ShieldCheck,
  "District export": FileDown,
  "API response": Braces,
  "Webhook delivery": Send,
} satisfies Record<(typeof trustSystemPanels)[number]["title"], LucideIcon>;

export function TrustSystemPanels() {
  return (
    <div className="grid gap-4">
      {trustSystemPanels.map((panel) => {
        const Icon = icons[panel.title];

        return (
          <div
            key={panel.title}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0 text-primary" />
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {panel.title}
                </p>
              </div>
              <p className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-1 font-mono text-xs text-neutral-600">
                {panel.label}
              </p>
            </div>
            <div className="grid gap-2 p-4 font-mono text-xs text-neutral-700">
              {panel.lines.map((line) => (
                <p
                  key={line}
                  className="min-w-0 break-words rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
