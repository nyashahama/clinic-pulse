import type { ReactNode } from "react";
import {
  ActivityIcon,
  Building2Icon,
  ClipboardListIcon,
  CompassIcon,
  DatabaseZapIcon,
  FileCheck2Icon,
  GaugeIcon,
  KeyRoundIcon,
  MapIcon,
  RadioTowerIcon,
  RouteIcon,
  ShieldIcon,
  StethoscopeIcon,
  UsersRoundIcon,
} from "lucide-react";

import type { AuthRole, ClientAuthSession } from "@/lib/auth/api";
import { getRoleHomeHref } from "@/lib/auth/role-home";

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
  eyebrow: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  primaryAction: DashboardNavItem;
  groups: DashboardNavGroup[];
};

const ROLE_WORKSPACES: Record<AuthRole, DashboardWorkspace> = {
  district_manager: {
    roleLabel: "District manager",
    workspaceLabel: "Command Center",
    eyebrow: "District command",
    title: "Clinic pressure, severity, and interventions",
    description:
      "Prioritize high-risk clinics, verify field signals, and move interventions through follow-up.",
    searchPlaceholder: "Search clinics, services, or field signals",
    primaryAction: {
      title: "Open severity queue",
      url: "/demo?status=non_functional",
      icon: <ActivityIcon />,
    },
    groups: [
      {
        label: "Command",
        items: [
          {
            title: "Command Center",
            url: getRoleHomeHref("district_manager"),
            icon: <Building2Icon />,
            items: [
              { title: "Severity queue", url: "/demo/severity-queue" },
              { title: "Clinic network", url: "/demo/clinic-network" },
              { title: "Interventions", url: "/demo/interventions" },
            ],
          },
          {
            title: "Clinic Finder",
            url: "/finder",
            icon: <CompassIcon />,
          },
        ],
      },
      {
        label: "Field signal",
        items: [
          {
            title: "Field Reports",
            url: "/field",
            icon: <MapIcon />,
          },
        ],
      },
    ],
  },
  reporter: {
    roleLabel: "Reporter",
    workspaceLabel: "Field Workbench",
    eyebrow: "Field workflow",
    title: "Assigned visits, drafts, and sync health",
    description:
      "Start with the assigned clinic, submit the status update, and recover safely when connectivity drops.",
    searchPlaceholder: "Search assigned clinics or report history",
    primaryAction: {
      title: "Submit report",
      url: getRoleHomeHref("reporter"),
      icon: <ClipboardListIcon />,
    },
    groups: [
      {
        label: "Today",
        items: [
          {
            title: "My Route",
            url: getRoleHomeHref("reporter"),
            icon: <RouteIcon />,
            items: [
              { title: "Submit report", url: "/field/submit-report" },
              { title: "Drafts and sync", url: "/field/drafts-sync" },
            ],
          },
          {
            title: "Sync Queue",
            url: "/field/sync-queue",
            icon: <RadioTowerIcon />,
            badge: "Offline-safe",
          },
        ],
      },
      {
        label: "Reference",
        items: [
          {
            title: "Clinic Finder",
            url: "/finder",
            icon: <CompassIcon />,
          },
        ],
      },
    ],
  },
  org_admin: {
    roleLabel: "Org admin",
    workspaceLabel: "Operations Admin",
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
            title: "Org Overview",
            url: getRoleHomeHref("org_admin"),
            icon: <GaugeIcon />,
            items: [
              { title: "Reporting coverage", url: "/admin/reporting-coverage" },
              { title: "Partner readiness", url: "/admin/partner-readiness" },
              { title: "Audit evidence", url: "/admin/audit-evidence" },
            ],
          },
          {
            title: "District Command",
            url: "/demo",
            icon: <Building2Icon />,
          },
          {
            title: "Clinic Finder",
            url: "/finder",
            icon: <CompassIcon />,
          },
          {
            title: "Field Workflow",
            url: "/field",
            icon: <MapIcon />,
          },
        ],
      },
      {
        label: "Administration",
        items: [
          {
            title: "Users & Roles",
            url: "/admin/users-roles",
            icon: <UsersRoundIcon />,
          },
          {
            title: "Integrations",
            url: "/admin/integrations",
            icon: <KeyRoundIcon />,
          },
        ],
      },
    ],
  },
  system_admin: {
    roleLabel: "System admin",
    workspaceLabel: "Platform Console",
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
            title: "Platform Health",
            url: getRoleHomeHref("system_admin"),
            icon: <ShieldIcon />,
            items: [
              { title: "Tenant health", url: "/admin/tenant-health" },
              { title: "Access review", url: "/admin/access-review" },
              { title: "Demo controls", url: "/admin/demo-controls" },
            ],
          },
          {
            title: "Data Ingestion",
            url: "/admin/data-ingestion",
            icon: <DatabaseZapIcon />,
          },
          {
            title: "Security",
            url: "/admin/security",
            icon: <FileCheck2Icon />,
          },
        ],
      },
      {
        label: "Operational modules",
        items: [
          {
            title: "District Command",
            url: "/demo",
            icon: <Building2Icon />,
          },
          {
            title: "Field Workflow",
            url: "/field",
            icon: <StethoscopeIcon />,
          },
          {
            title: "Clinic Finder",
            url: "/finder",
            icon: <CompassIcon />,
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
