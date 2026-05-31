export type DataSource =
  | "scenario_seed"
  | "pilot_import"
  | "field_report"
  | "system_reconciliation"
  | "partner_export";

export type DataFreshness = "fresh" | "needs_confirmation" | "stale" | "unknown";

export type ReviewState =
  | "reviewed"
  | "pending_review"
  | "rejected"
  | "not_required"
  | "unknown";

export type TrustConfidence = "high" | "medium" | "low" | "unknown";

export type TrustTone = "clear" | "attention" | "blocked";

export type DataTrustInput = {
  source: DataSource;
  freshness: DataFreshness;
  reviewState: ReviewState;
  lastVerifiedAt?: string;
  evidenceHref?: string;
};

export type DataTrustState = {
  tone: TrustTone;
  confidence: TrustConfidence;
  label: string;
  description: string;
  evidenceHref?: string;
};

const sourceLabels: Record<DataSource, string> = {
  scenario_seed: "Scenario data",
  pilot_import: "Imported data",
  field_report: "Field data",
  system_reconciliation: "System reconciliation data",
  partner_export: "Partner export data",
};

const freshnessLabels: Record<DataFreshness, string> = {
  fresh: "fresh freshness",
  needs_confirmation: "needs confirmation",
  stale: "stale freshness",
  unknown: "unknown freshness",
};

const reviewLabels: Record<ReviewState, string> = {
  reviewed: "reviewed review",
  pending_review: "pending review",
  rejected: "rejected review",
  not_required: "review not required",
  unknown: "unknown review",
};

export function formatTrustLabel(
  source: DataSource,
  freshness: DataFreshness,
  reviewState: ReviewState,
): string {
  return `${sourceLabels[source]} / ${freshnessLabels[freshness]} / ${reviewLabels[reviewState]}`;
}

export function buildDataTrustState(input: DataTrustInput): DataTrustState {
  const base = { evidenceHref: input.evidenceHref };

  if (input.reviewState === "rejected") {
    return {
      ...base,
      tone: "blocked",
      confidence: "low",
      label: "Rejected data",
      description: `${sourceLabels[input.source]} was rejected during review.`,
    };
  }

  if (input.freshness === "stale") {
    return {
      ...base,
      tone: "blocked",
      confidence: "low",
      label: `Stale ${sourceLabels[input.source].toLowerCase()}`,
      description: `${sourceLabels[input.source]} is stale and should be refreshed before use.`,
    };
  }

  if (input.reviewState === "pending_review" || input.freshness === "needs_confirmation") {
    return {
      ...base,
      tone: "attention",
      confidence: "medium",
      label: "Pending review",
      description: `${sourceLabels[input.source]} needs review before it is treated as confirmed.`,
    };
  }

  if (input.source === "scenario_seed") {
    return {
      ...base,
      tone: "attention",
      confidence: "low",
      label: "Scenario data",
      description: "Scenario-seeded data supports local operations rehearsal, not pilot decisions.",
    };
  }

  if (
    input.freshness === "fresh" &&
    (input.reviewState === "reviewed" || input.reviewState === "not_required")
  ) {
    return {
      ...base,
      tone: "clear",
      confidence: "high",
      label: input.reviewState === "reviewed" ? reviewedLabel(input.source) : sourceLabels[input.source],
      description: freshHighConfidenceDescription(input),
    };
  }

  return {
    ...base,
    tone: "attention",
    confidence: "unknown",
    label: "Trust state unknown",
    description: formatTrustLabel(input.source, input.freshness, input.reviewState),
  };
}

function reviewedLabel(source: DataSource): string {
  if (source === "field_report") {
    return "Reviewed field data";
  }

  return `Reviewed ${sourceLabels[source].toLowerCase()}`;
}

function freshHighConfidenceDescription(input: DataTrustInput): string {
  const source = input.source === "field_report" ? "field-submitted data" : sourceLabels[input.source].toLowerCase();
  const timestamp = input.lastVerifiedAt ? formatUtcMinute(input.lastVerifiedAt) : undefined;

  if (input.reviewState === "not_required") {
    const verifiedAt = timestamp ? ` Last verified at ${timestamp}.` : "";

    return `Fresh ${source} does not require review.${verifiedAt}`;
  }

  const verifiedAt = timestamp ? ` at ${timestamp}` : "";

  return `Fresh ${source} reviewed${verifiedAt}.`;
}

function formatUtcMinute(value: string): string | undefined {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}
