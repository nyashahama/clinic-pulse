"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseMedical,
  Database,
  RotateCcw,
  Search,
  Users,
  Wifi,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import { getClinicRows } from "@/lib/demo/selectors";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const { state, resetDemo, syncOfflineReports, triggerStaffingShortage, triggerStockout } =
    useDemoStore();
  const clinics = getClinicRows(state);
  const [query, setQuery] = useState("");

  const closePalette = useCallback(() => {
    setQuery("");
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

  const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePalette();
      }

      if ((event.key === "Enter" || event.key === "ArrowRight") && event.target instanceof HTMLInputElement) {
        const nextQuery = query.trim() || clinics[0]?.name || "";

        if (nextQuery) {
          event.preventDefault();
          router.push(`/finder?query=${encodeURIComponent(nextQuery)}`);
          closePalette();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, open, query, clinics, router]);

  const clinicResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return clinics.slice(0, 5);
    }

    return clinics
      .filter((clinic) => {
        const haystack = [
          clinic.name,
          clinic.facilityCode,
          clinic.district,
          clinic.services.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, 5);
  }, [clinics, query]);

  const commands = [
    {
      label: "Search clinic",
      hint: query.trim() || "Open finder with the current search",
      icon: Search,
      run: () => {
        const nextQuery = query.trim() || clinics[0]?.name || "";
        router.push(
          nextQuery
            ? `/finder?query=${encodeURIComponent(nextQuery)}`
            : "/finder",
        );
      },
    },
    {
      label: "Open non-functional clinics",
      hint: "District Console",
      icon: AlertTriangle,
      run: () => router.push("/demo?status=non_functional"),
    },
    {
      label: "Trigger stockout",
      hint: "Mamelodi East Community Clinic",
      icon: BriefcaseMedical,
      run: () => triggerStockout(STOCKOUT_TRIGGER_CLINIC_ID),
    },
    {
      label: "Trigger staffing shortage",
      hint: "Soshanguve Block F Clinic",
      icon: Users,
      run: () => triggerStaffingShortage(STAFFING_TRIGGER_CLINIC_ID),
    },
    {
      label: "Sync offline reports",
      hint: "Push queued field updates",
      icon: Wifi,
      run: () => syncOfflineReports(),
    },
    {
      label: "Open finder",
      hint: "Public routing surface",
      icon: Search,
      run: () => router.push("/finder"),
    },
    {
      label: "Open API preview",
      hint: "Admin preview panel",
      icon: Database,
      run: () => router.push("/admin?panel=api-preview"),
    },
    {
      label: "Reset demo",
      hint: "Clear local demo changes",
      icon: RotateCcw,
      run: () => resetDemo(),
    },
  ];

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ClinicPulse command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-950/45 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={closePalette}
    >
      <h2 id="command-palette-title" className="sr-only">
        ClinicPulse command palette
      </h2>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <span className="sr-only">Search</span>
          <Search className="size-4 text-neutral-500" />
          <input
            role="searchbox"
            aria-labelledby="command-palette-title"
            aria-describedby="command-palette-help"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clinics or run a command"
            className="h-8 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closePalette}
            aria-label="Close command palette"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid gap-0 border-b border-neutral-200 md:grid-cols-[1.1fr,0.9fr]">
          <section className="border-b border-neutral-200 p-3 md:border-b-0 md:border-r">
            <p id="command-palette-help" className="mb-2 px-2 text-xs font-medium tracking-[0.02em] text-neutral-500 uppercase">
              Search clinic
            </p>
            <div role="list" className="space-y-1">
              {clinicResults.map((clinic) => (
                <button
                  key={clinic.id}
                  role="listitem"
                  type="button"
                    onClick={() => {
                      router.push(`/finder?query=${encodeURIComponent(clinic.name)}`);
                      closePalette();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-neutral-100"
                  >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-neutral-900">
                      {clinic.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {clinic.facilityCode} · {clinic.status.replaceAll("_", " ")}
                    </span>
                  </span>
                  <Search className="size-4 shrink-0 text-neutral-400" />
                </button>
              ))}
            </div>
          </section>

          <section className="p-3">
            <p className="mb-2 px-2 text-xs font-medium tracking-[0.02em] text-neutral-500 uppercase">
              Actions
            </p>
            <div role="list" className="space-y-1">
              {commands.map((command) => {
                const Icon = command.icon;

                return (
                  <button
                    key={command.label}
                    role="listitem"
                    aria-label={`${command.label}: ${command.hint}`}
                    type="button"
                    onClick={() => {
                      command.run();
                      closePalette();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-100"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-900">
                        {command.label}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {command.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-neutral-500">
          <span>Quick actions for the founder-led demo flow.</span>
          <span className="font-mono text-[11px] text-neutral-700">Esc</span>
        </div>
      </div>
    </div>
  );
}
