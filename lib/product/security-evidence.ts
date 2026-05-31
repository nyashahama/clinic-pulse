import type {
  EvidenceCommandChip,
  EvidenceCommandDecision,
  EvidenceCommandMetric,
  EvidenceCommandSection,
  EvidenceCommandTimelineItem,
  EvidenceCommandTone,
} from "@/lib/product/evidence-command";

export type SecurityEvidenceTone = "clear" | "attention" | "blocked" | "info";

export type SecurityEvidenceKind =
  | "credential"
  | "webhook"
  | "privileged-access"
  | "audit";

export type SecurityEvidenceStateFilter =
  | "all"
  | "needs-review"
  | "clear"
  | "info"
  | "blocked";

export type SecurityEvidenceKindFilter = SecurityEvidenceKind | "all";

export type SecuritySummaryMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: SecurityEvidenceTone;
};

export type SecurityEvidenceRow = {
  id: string;
  kind: SecurityEvidenceKind;
  sourceHref: string;
  ariaLabel: string;
  subject: string;
  subjectDetail: string;
  stateLabel: string;
  stateTone: SecurityEvidenceTone;
  evidenceBasis: string;
  observedLabel: string;
  actorLabel?: string;
  entityLabel?: string;
  sourceLabel: string;
  reviewState: string;
  nextStep: string;
  rawFacts: Array<{ label: string; value: string }>;
  searchText: string;
};

export type SecurityEvidenceSourceReference = {
  source: string;
  role: string;
  href: string;
  licenseUse: "adaptable" | "reference-only";
};

export type SecurityEvidenceViewModel = {
  commandBrief: {
    chips: EvidenceCommandChip[];
    metrics: EvidenceCommandMetric[];
    caseBrief: {
      title: string;
      description: string;
      summary: {
        label: string;
        value: string;
        tone: EvidenceCommandTone;
        emphasis: true;
      };
      primaryFields: Array<{
        label: string;
        value: string;
        href?: string;
        tone?: EvidenceCommandTone;
        emphasis?: boolean;
      }>;
      sections: EvidenceCommandSection[];
    };
    decision: EvidenceCommandDecision;
    timeline: {
      title: string;
      description: string;
      items: EvidenceCommandTimelineItem[];
    };
  };
  metrics: SecuritySummaryMetric[];
  rows: SecurityEvidenceRow[];
  posture: {
    tone: SecurityEvidenceTone;
    summary: string;
  };
  sourceReferences: SecurityEvidenceSourceReference[];
};

export function getDefaultSecurityEvidenceRowId(rows: SecurityEvidenceRow[]) {
  return (
    rows.find((row) => row.stateTone === "blocked" || row.stateTone === "attention")
      ?.id ?? rows[0]?.id ?? null
  );
}

export function filterSecurityEvidenceRows(
  rows: SecurityEvidenceRow[],
  {
    activeKind,
    stateFilter,
    query,
  }: {
    activeKind: SecurityEvidenceKindFilter;
    stateFilter: SecurityEvidenceStateFilter;
    query: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();

  return rows.filter((row) => {
    const kindMatches = activeKind === "all" || row.kind === activeKind;
    const stateMatches =
      stateFilter === "all" ||
      (stateFilter === "needs-review" &&
        (row.stateTone === "attention" || row.stateTone === "blocked")) ||
      row.stateTone === stateFilter;
    const queryMatches = !normalizedQuery || row.searchText.includes(normalizedQuery);

    return kindMatches && stateMatches && queryMatches;
  });
}
