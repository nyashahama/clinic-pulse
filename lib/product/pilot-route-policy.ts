export type PilotRouteOutcome = "complete" | "hide" | "demo_sandbox";

export type PilotRoutePolicy = {
  route: string;
  pilotCritical: boolean;
  allowedOutcomes: PilotRouteOutcome[];
};

export const pilotCriticalRoutes = [
  "/field",
  "/field/submit-report",
  "/field/sync-queue",
  "/field/drafts-sync",
  "/district",
  "/admin/reporting-coverage",
  "/admin/audit-evidence",
  "/admin/data-ingestion",
  "/admin/security",
  "/admin/tenant-health",
  "/admin/partner-readiness",
] as const;

const pilotCriticalRouteSet = new Set<string>(pilotCriticalRoutes);

export function pilotRoutePolicyFor(route: string): PilotRoutePolicy {
  const pilotCritical = pilotCriticalRouteSet.has(route);

  return {
    route,
    pilotCritical,
    allowedOutcomes: pilotCritical ? ["complete", "hide"] : ["demo_sandbox", "hide"],
  };
}
