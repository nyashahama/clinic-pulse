export type DataIngestionSourceReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

export const dataIngestionSourceReferences: DataIngestionSourceReference[] = [
  {
    source: "Trigger.dev",
    role: "Queue pressure, run status hierarchy, and operational backlog framing.",
    href: "https://github.com/triggerdotdev/trigger.dev",
    licenseUse: "adaptable",
  },
  {
    source: "OpenStatus",
    role: "Freshness and service-health language for visible ingestion reliability.",
    href: "https://github.com/openstatusHQ/openstatus",
    licenseUse: "reference-only",
  },
  {
    source: "Supabase Studio",
    role: "Source-led table/detail review and compact admin workspace structure.",
    href: "https://github.com/supabase/supabase",
    licenseUse: "adaptable",
  },
  {
    source: "Unkey audit logs",
    role: "Selected-row evidence inspection and auditable source-record drilldown.",
    href: "https://github.com/unkeyed/unkey",
    licenseUse: "reference-only",
  },
];
