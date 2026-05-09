import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  ClipboardList,
  Compass,
  DatabaseZap,
  FileCheck2,
  Gauge,
  KeyRound,
  Map,
  RadioTower,
  Route,
  Shield,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import type { AuthRole } from "@/lib/auth/api";
import { getRoleHomeHref } from "@/lib/auth/role-home";

export type RoleNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
};

export type RoleNavigationGroup = {
  label: string;
  items: RoleNavigationItem[];
};

export type RoleWorkspace = {
  role: AuthRole;
  roleLabel: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  homeHref: string;
  primaryAction: RoleNavigationItem;
  searchPlaceholder: string;
  sidebarGroups: RoleNavigationGroup[];
  footer: {
    title: string;
    description: string;
  };
};

export const ROLE_WORKSPACES: Record<AuthRole, RoleWorkspace> = {
  district_manager: {
    role: "district_manager",
    roleLabel: "District manager",
    label: "Command Center",
    eyebrow: "District command",
    title: "Clinic pressure, severity, and interventions",
    description:
      "Prioritize the clinics that need action now, verify field signal quality, and move interventions through follow-up.",
    homeHref: getRoleHomeHref("district_manager"),
    primaryAction: {
      label: "Open severity queue",
      href: "/demo?status=non_functional",
      icon: Activity,
    },
    searchPlaceholder: "Search clinics, services, or field signals",
    sidebarGroups: [
      {
        label: "Command",
        items: [
          {
            label: "Command Center",
            href: "/demo",
            icon: Building2,
            description: "Severity, interventions, and district briefing.",
          },
          {
            label: "Severity Queue",
            href: "/demo?status=non_functional",
            icon: Activity,
            description: "High-risk clinics requiring district action.",
          },
          {
            label: "Clinic Finder",
            href: "/finder",
            icon: Compass,
            description: "Find service alternatives and reroute options.",
          },
        ],
      },
      {
        label: "Field signal",
        items: [
          {
            label: "Field Reports",
            href: "/field",
            icon: Map,
            description: "Review the reporting workflow used by field teams.",
          },
        ],
      },
    ],
    footer: {
      title: "District workflow",
      description:
        "Use Command for decisions, Finder for routing confidence, and Field Reports for signal quality.",
    },
  },
  reporter: {
    role: "reporter",
    roleLabel: "Reporter",
    label: "Field Workbench",
    eyebrow: "Field workflow",
    title: "Assigned visits, drafts, and sync health",
    description:
      "Start with the clinic you are visiting, capture the status update, and recover safely when the network drops.",
    homeHref: getRoleHomeHref("reporter"),
    primaryAction: {
      label: "Submit report",
      href: "/field",
      icon: ClipboardList,
    },
    searchPlaceholder: "Search assigned clinics or report history",
    sidebarGroups: [
      {
        label: "Today",
        items: [
          {
            label: "My Route",
            href: "/field",
            icon: Route,
            description: "Assigned clinics, selected visit, and report form.",
          },
          {
            label: "Sync Queue",
            href: "/field",
            icon: RadioTower,
            description: "Offline reports waiting for connectivity.",
            badge: "Offline-safe",
          },
        ],
      },
      {
        label: "Reference",
        items: [
          {
            label: "Clinic Finder",
            href: "/finder",
            icon: Compass,
            description: "Look up clinics before or after a visit.",
          },
        ],
      },
    ],
    footer: {
      title: "Field workflow",
      description:
        "Pick a clinic, submit the report, then confirm the queue is synced before closing your visit.",
    },
  },
  org_admin: {
    role: "org_admin",
    roleLabel: "Org admin",
    label: "Operations Admin",
    eyebrow: "Organisation operations",
    title: "Readiness, coverage, users, and governance",
    description:
      "See whether districts are reporting cleanly, users have the right access, and operating evidence is ready for handoff.",
    homeHref: getRoleHomeHref("org_admin"),
    primaryAction: {
      label: "Review users",
      href: "/admin",
      icon: UsersRound,
    },
    searchPlaceholder: "Search clinics, districts, users, or reports",
    sidebarGroups: [
      {
        label: "Operations",
        items: [
          {
            label: "Org Overview",
            href: "/admin",
            icon: Gauge,
            description: "Coverage, data quality, and readiness.",
          },
          {
            label: "District Command",
            href: "/demo",
            icon: Building2,
            description: "Inspect the live district command module.",
          },
          {
            label: "Clinic Finder",
            href: "/finder",
            icon: Compass,
            description: "Validate public routing and service alternatives.",
          },
          {
            label: "Field Workflow",
            href: "/field",
            icon: Map,
            description: "Audit the reporting experience used by field teams.",
          },
        ],
      },
      {
        label: "Administration",
        items: [
          {
            label: "Users & Roles",
            href: "/admin",
            icon: UsersRound,
            description: "Manage access and stale accounts.",
          },
          {
            label: "Integrations",
            href: "/admin",
            icon: KeyRound,
            description: "Partner keys, webhooks, and export readiness.",
          },
        ],
      },
    ],
    footer: {
      title: "Admin workflow",
      description:
        "Use this workspace to validate coverage, people, partner readiness, and governance evidence.",
    },
  },
  system_admin: {
    role: "system_admin",
    roleLabel: "System admin",
    label: "Platform Console",
    eyebrow: "Platform operations",
    title: "Tenants, ingestion, security, and reliability",
    description:
      "Monitor the platform control plane, verify data ingestion health, and keep tenant access auditable.",
    homeHref: getRoleHomeHref("system_admin"),
    primaryAction: {
      label: "Review platform health",
      href: "/admin",
      icon: Shield,
    },
    searchPlaceholder: "Search tenants, clinics, users, or audit evidence",
    sidebarGroups: [
      {
        label: "Platform",
        items: [
          {
            label: "Platform Health",
            href: "/admin",
            icon: Shield,
            description: "Tenant health, jobs, and operational controls.",
          },
          {
            label: "Data Ingestion",
            href: "/admin",
            icon: DatabaseZap,
            description: "Sync status, exports, and webhook readiness.",
          },
          {
            label: "Security",
            href: "/admin",
            icon: FileCheck2,
            description: "Audit activity and access review focus.",
          },
        ],
      },
      {
        label: "Operational modules",
        items: [
          {
            label: "District Command",
            href: "/demo",
            icon: Building2,
            description: "Inspect a district command module.",
          },
          {
            label: "Field Workflow",
            href: "/field",
            icon: Stethoscope,
            description: "Validate field reporting and offline sync.",
          },
          {
            label: "Clinic Finder",
            href: "/finder",
            icon: Compass,
            description: "Check clinic search and rerouting behavior.",
          },
        ],
      },
    ],
    footer: {
      title: "Platform workflow",
      description:
        "Stay inside platform operations: tenants, ingestion, audit, security, and demo controls.",
    },
  },
};

export function getRoleWorkspace(role: AuthRole) {
  return ROLE_WORKSPACES[role];
}
