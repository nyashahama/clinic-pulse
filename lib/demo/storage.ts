import type { DemoLead, QueuedOfflineReport } from "@/lib/demo/types";

export const DEMO_LEADS_STORAGE_KEY = "clinicpulse.demo.leads";
export const DEMO_OFFLINE_REPORTS_STORAGE_KEY = "clinicpulse.demo.offlineReports";

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

export function loadStoredDemoLeads(): DemoLead[] {
  return readArray<DemoLead>(DEMO_LEADS_STORAGE_KEY);
}

export function saveStoredDemoLeads(leads: DemoLead[]) {
  writeArray(DEMO_LEADS_STORAGE_KEY, leads);
}

export function loadStoredOfflineReports(): QueuedOfflineReport[] {
  return readArray<QueuedOfflineReport>(DEMO_OFFLINE_REPORTS_STORAGE_KEY);
}

export function saveStoredOfflineReports(reports: QueuedOfflineReport[]) {
  writeArray(DEMO_OFFLINE_REPORTS_STORAGE_KEY, reports);
}

export function clearDemoStorage() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(DEMO_LEADS_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_OFFLINE_REPORTS_STORAGE_KEY);
}
