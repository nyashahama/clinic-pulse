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

export type SecurityEvidenceViewModel = {
  metrics: SecuritySummaryMetric[];
  rows: SecurityEvidenceRow[];
  posture: {
    tone: SecurityEvidenceTone;
    summary: string;
  };
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
