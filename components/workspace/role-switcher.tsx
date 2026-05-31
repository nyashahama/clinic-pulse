"use client";

import type { WorkspaceRole } from "@/lib/workspace/types";
import { useWorkspaceStore } from "@/lib/workspace/workspace-store";

const ROLE_OPTIONS: Array<{ value: WorkspaceRole; label: string }> = [
  { value: "founder_admin", label: "Founder / Admin" },
  { value: "district_manager", label: "District Manager" },
  { value: "field_worker", label: "Field Worker" },
  { value: "clinic_coordinator", label: "Clinic Coordinator" },
  { value: "public_user", label: "Public User" },
  { value: "partner_api", label: "Partner API" },
];

export function RoleSwitcher() {
  const { state, setRole } = useWorkspaceStore();

  return (
    <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-border dark:bg-card">
      <span className="hidden text-xs font-medium text-neutral-500 dark:text-muted-foreground sm:inline">
        Role
      </span>
      <select
        aria-label="Switch workspace role"
        value={state.role}
        onChange={(event) => setRole(event.target.value as WorkspaceRole)}
        className="min-w-0 bg-transparent text-sm font-medium text-neutral-900 outline-none dark:text-foreground"
      >
        {ROLE_OPTIONS.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </label>
  );
}
