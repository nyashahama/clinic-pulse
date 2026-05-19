"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseMedical,
  Database,
  RotateCcw,
  Search,
  Users,
  Wifi,
} from "lucide-react";

import {
  WorkspaceCommandPalette,
  type WorkspaceCommandPaletteAction,
  type WorkspaceCommandPaletteSearchResult,
} from "@/components/product/workspace-command-palette";
import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import { useDemoStore } from "@/lib/demo/demo-store";
import { getClinicRows } from "@/lib/demo/selectors";

type CommandPaletteProps = {
  districtConsoleHref?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({
  districtConsoleHref = "/demo",
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

  const openFinder = useCallback(
    (nextQuery: string) => {
      router.push(
        nextQuery ? `/finder?query=${encodeURIComponent(nextQuery)}` : "/finder",
      );
    },
    [router],
  );

  const submitSearch = useCallback(() => {
    openFinder(query.trim() || clinics[0]?.name || "");
    closePalette();
  }, [clinics, closePalette, openFinder, query]);

  const searchResults = useMemo<WorkspaceCommandPaletteSearchResult[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = normalizedQuery
      ? clinics.filter((clinic) => {
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
      : clinics;

    return results.slice(0, 5).map((clinic) => ({
      id: clinic.id,
      title: clinic.name,
      subtitle: `${clinic.facilityCode} · ${clinic.status.replaceAll("_", " ")}`,
      icon: Search,
      onSelect: () => openFinder(clinic.name),
    }));
  }, [clinics, openFinder, query]);

  const actions = useMemo<WorkspaceCommandPaletteAction[]>(
    () => [
      {
        label: "Search clinic",
        hint: query.trim() || "Open finder with the current search",
        icon: Search,
        run: submitSearch,
      },
      {
        label: "Open non-functional clinics",
        hint: "District Console",
        icon: AlertTriangle,
        run: () => router.push(`${districtConsoleHref}?status=non_functional`),
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
        label: "Reset scenario",
        hint: "Clear local scenario changes",
        icon: RotateCcw,
        run: () => resetDemo(),
      },
    ],
    [
      districtConsoleHref,
      query,
      resetDemo,
      router,
      submitSearch,
      syncOfflineReports,
      triggerStaffingShortage,
      triggerStockout,
    ],
  );

  return (
    <WorkspaceCommandPalette
      actions={actions}
      footerText="Quick actions for the operations workflow."
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true);
        } else {
          closePalette();
        }
      }}
      onQueryChange={setQuery}
      onSubmitSearch={submitSearch}
      open={open}
      query={query}
      searchLabel="Search clinic"
      searchPlaceholder="Search clinics or run a command"
      searchResults={searchResults}
    />
  );
}
