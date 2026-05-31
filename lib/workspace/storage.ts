import type { WalkthroughLead, QueuedOfflineReport } from "@/lib/workspace/types";

export const WORKSPACE_LEADS_STORAGE_KEY = "clinicpulse.workspace.leads";
export const WORKSPACE_OFFLINE_REPORTS_STORAGE_KEY = "clinicpulse.workspace.offlineReports";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readArray<T>(key: string): T[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadStoredWalkthroughLeads(): WalkthroughLead[] {
  return readArray<WalkthroughLead>(WORKSPACE_LEADS_STORAGE_KEY);
}

export function saveStoredWalkthroughLeads(leads: WalkthroughLead[]) {
  writeArray(WORKSPACE_LEADS_STORAGE_KEY, leads);
}

export function loadStoredOfflineReports(): QueuedOfflineReport[] {
  return readArray<QueuedOfflineReport>(WORKSPACE_OFFLINE_REPORTS_STORAGE_KEY);
}

export function saveStoredOfflineReports(reports: QueuedOfflineReport[]) {
  writeArray(WORKSPACE_OFFLINE_REPORTS_STORAGE_KEY, reports);
}

export function clearWorkspaceStorage() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(WORKSPACE_LEADS_STORAGE_KEY);
  window.localStorage.removeItem(WORKSPACE_OFFLINE_REPORTS_STORAGE_KEY);
}
