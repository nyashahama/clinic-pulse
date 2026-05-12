import type { ReactNode } from "react";
import {
  ActivityIcon,
  Building2Icon,
  ClipboardListIcon,
  GaugeIcon,
  RouteIcon,
  ShieldIcon,
  UsersRoundIcon,
} from "lucide-react";

import type { AuthRole, ClientAuthSession } from "@/lib/auth/api";

export type DashboardNavItem = {
  title: string;
  url: string;
  icon: ReactNode;
  badge?: string;
  items?: Array<{
    title: string;
    url: string;
  }>;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardWorkspace = {
  roleLabel: string;
  workspaceLabel: string;
  homeUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  primaryAction: DashboardNavItem;
  groups: DashboardNavGroup[];
};

export const HIDDEN_DASHBOARD_PRIMARY_NAV_ROUTES = [
  "/field/submit-report",
  "/field/drafts-sync",
  "/field/recent-reports",
  "/field/sync-queue",
  "/district/severity-queue",
  "/district/clinic-network",
  "/district/clinic-evidence",
  "/district/interventions",
  "/admin/exports",
  "/admin/demo-controls",
] as const;

export const PUBLIC_DASHBOARD_NAV_EXCLUSIONS = [
  "/",
  "/book-demo",
  "/book-demo/thanks",
  "/finder",
  "/clinics",
  "/login",
  "/register",
] as const;

const ROLE_WORKSPACES: Record<AuthRole, DashboardWorkspace> = {
  district_manager: {
    roleLabel: "District manager",
    workspaceLabel: "Command Center",
    homeUrl: "/district",
    eyebrow: "District command",
    title: "Clinic pressure, severity, and interventions",
    description:
      "Prioritize high-risk clinics, verify field signals, and move interventions through follow-up.",
    searchPlaceholder: "Search clinics, services, or field signals",
    primaryAction: {
      title: "Open severity queue",
      url: "/district#severity-queue",
      icon: <ActivityIcon />,
    },
    groups: [
      {
        label: "Command",
        items: [
          {
            title: "Command Center",
            url: "/district",
            icon: <Building2Icon />,
            items: [
              { title: "Severity queue", url: "/district#severity-queue" },
              { title: "Clinic network", url: "/district#clinic-network" },
              { title: "Clinic evidence", url: "/district#clinic-evidence" },
              { title: "Interventions", url: "/district#interventions" },
            ],
          },
        ],
      },
    ],
  },
  reporter: {
    roleLabel: "Reporter",
    workspaceLabel: "Field Workbench",
    homeUrl: "/field",
    eyebrow: "Field workflow",
    title: "Assigned visits, drafts, and sync health",
    description:
      "Start with the assigned clinic, submit the status update, and recover safely when connectivity drops.",
    searchPlaceholder: "Search assigned clinics or report history",
    primaryAction: {
      title: "Submit report",
      url: "/field#submit-report",
      icon: <ClipboardListIcon />,
    },
    groups: [
      {
        label: "Today",
        items: [
          {
            title: "Field Workbench",
            url: "/field",
            icon: <RouteIcon />,
            items: [
              { title: "Submit report", url: "/field#submit-report" },
              { title: "Drafts and sync", url: "/field#drafts-sync" },
              { title: "Recent reports", url: "/field#recent-reports" },
            ],
          },
        ],
      },
    ],
  },
  org_admin: {
    roleLabel: "Org admin",
    workspaceLabel: "Admin Overview",
    homeUrl: "/admin",
    eyebrow: "Organisation operations",
    title: "Readiness, coverage, users, and governance",
    description:
      "Track district readiness, data quality, user access, and partner evidence from one operations surface.",
    searchPlaceholder: "Search clinics, districts, users, or reports",
    primaryAction: {
      title: "Review users",
      url: "/admin/users-roles",
      icon: <UsersRoundIcon />,
    },
    groups: [
      {
        label: "Operations",
        items: [
          {
            title: "Admin Overview",
            url: "/admin",
            icon: <GaugeIcon />,
            items: [
              { title: "Reporting coverage", url: "/admin/reporting-coverage" },
              { title: "Users and roles", url: "/admin/users-roles" },
              { title: "Access review", url: "/admin/access-review" },
              { title: "Partner readiness", url: "/admin/partner-readiness" },
              { title: "Integrations", url: "/admin/integrations" },
              { title: "Audit evidence", url: "/admin/audit-evidence" },
              { title: "Exports", url: "/admin#exports" },
            ],
          },
        ],
      },
    ],
  },
  system_admin: {
    roleLabel: "System admin",
    workspaceLabel: "Platform Overview",
    homeUrl: "/admin",
    eyebrow: "Platform operations",
    title: "Tenants, ingestion, security, and reliability",
    description:
      "Monitor platform health, tenant access, ingestion state, and audit evidence from the control plane.",
    searchPlaceholder: "Search tenants, clinics, users, or audit evidence",
    primaryAction: {
      title: "Review platform health",
      url: "/admin/tenant-health",
      icon: <ShieldIcon />,
    },
    groups: [
      {
        label: "Platform",
        items: [
          {
            title: "Platform Overview",
            url: "/admin",
            icon: <ShieldIcon />,
            items: [
              { title: "Tenant health", url: "/admin/tenant-health" },
              { title: "Data ingestion", url: "/admin/data-ingestion" },
              { title: "Security", url: "/admin/security" },
              { title: "Integrations", url: "/admin/integrations" },
              { title: "Demo controls", url: "/admin#demo-controls" },
              { title: "Audit evidence", url: "/admin/audit-evidence" },
            ],
          },
        ],
      },
    ],
  },
};

export function getDashboardWorkspace(role: AuthRole) {
  return ROLE_WORKSPACES[role];
}

export function getDashboardScope(session: ClientAuthSession) {
  return (
    session.organisationName ??
    session.district ??
    getDashboardWorkspace(session.role).workspaceLabel
  );
}
