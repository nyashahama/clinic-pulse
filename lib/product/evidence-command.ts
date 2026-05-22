export type EvidenceCommandTone =
  | "critical"
  | "attention"
  | "watch"
  | "stable"
  | "info"
  | "neutral";

export type EvidenceCommandMetric = {
  label: string;
  value: string;
  detail: string;
  tone: EvidenceCommandTone;
  icon?: "activity" | "alert" | "check" | "clock" | "mail" | "user";
};

export type EvidenceCommandChip = {
  label: string;
  tone?: EvidenceCommandTone;
};

export type EvidenceCommandField = {
  label: string;
  value: string;
  href?: string;
  tone?: EvidenceCommandTone;
  emphasis?: boolean;
  fullWidth?: boolean;
};

export type EvidenceCommandSection = {
  title: string;
  description?: string;
  fields: EvidenceCommandField[];
};

export type EvidenceCommandEvidenceLink = {
  label: string;
  detail: string;
  href?: string;
  tone?: EvidenceCommandTone;
};

export type EvidenceCommandAction = {
  label: string;
  href: string;
  priority: "primary" | "secondary";
  icon: "clinic" | "mail" | "queue" | "report" | "stream";
};

export type EvidenceCommandTimelineItem = {
  label: string;
  title: string;
  description: string;
  timestamp?: string;
  tone?: EvidenceCommandTone;
};

export type EvidenceCommandDecision = {
  contextLabel: string;
  title: string;
  scoreLabel?: string;
  scoreValue?: string;
  chips: EvidenceCommandChip[];
  nextStep: string;
  nextStepTone: EvidenceCommandTone;
  impactTitle: string;
  impact: string;
  verificationTitle?: string;
  verification?: string;
  evidence?: EvidenceCommandEvidenceLink;
  actions: EvidenceCommandAction[];
};

export type EvidenceCommandDecisionCopy = {
  title: string;
  nextStep: string;
  impact: string;
  verification: string;
  tone: EvidenceCommandTone;
};

export function formatEvidenceLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function formatEvidenceSource(
  value: string,
  options: { offlineCreated?: boolean } = {},
) {
  const source = value === "seed" ? "scenario seed" : formatEvidenceLabel(value);

  if (options.offlineCreated) {
    return `${source} / synced offline`;
  }

  return source;
}

export function getReportStatusTone(status: string): EvidenceCommandTone {
  if (status === "non_functional") {
    return "critical";
  }

  if (status === "degraded") {
    return "attention";
  }

  if (status === "operational") {
    return "stable";
  }

  return "watch";
}

export function getPressureTone(
  value: string,
  kind?: "queue" | "staff" | "stock",
): EvidenceCommandTone {
  if (value === "critical" || value === "high" || value === "stockout" || value === "none") {
    return "critical" satisfies EvidenceCommandTone;
  }

  if (value === "strained" || value === "moderate" || value === "medium") {
    return "attention" satisfies EvidenceCommandTone;
  }

  if (value === "low") {
    return kind === "stock"
      ? ("attention" satisfies EvidenceCommandTone)
      : ("stable" satisfies EvidenceCommandTone);
  }

  if (value === "normal" || value === "ok") {
    return "stable" satisfies EvidenceCommandTone;
  }

  return "neutral" satisfies EvidenceCommandTone;
}

export function getLeadStatusTone(status: string): EvidenceCommandTone {
  if (status === "completed") {
    return "stable";
  }

  if (status === "scheduled" || status === "contacted") {
    return "info";
  }

  return "attention";
}

export function buildReportDecisionCopy({
  queuePressure,
  reviewState,
  staffPressure,
  status,
}: {
  queuePressure: string;
  reviewState?: string;
  staffPressure: string;
  status: string;
}): EvidenceCommandDecisionCopy {
  const pressureTone =
    getPressureTone(queuePressure, "queue") === "critical" ||
    getPressureTone(staffPressure, "staff") === "critical"
      ? "critical"
      : getReportStatusTone(status);

  if (status === "non_functional") {
    return {
      title: "Service interruption decision",
      nextStep:
        "Confirm the disruption, review clinic alternatives, and keep the command queue owner informed.",
      impact:
        "Patients may need rerouting or active communication before arriving at this facility.",
      verification:
        "Compare the field evidence with clinic context, alerts, and nearby capacity before closing the signal.",
      tone: "critical" satisfies EvidenceCommandTone,
    };
  }

  if (status === "degraded" || pressureTone === "critical") {
    return {
      title: "Capacity risk decision",
      nextStep:
        "Review the clinic context, confirm capacity pressure, and decide whether this evidence changes routing posture.",
      impact:
        "Patients can still be served, but queues, staffing, or stock pressure may change where they should be sent.",
      verification:
        "Check whether this report matches the latest clinic readiness and any active district alerts.",
      tone: pressureTone,
    };
  }

  if (status === "unknown" || reviewState === "pending") {
    return {
      title: "Signal verification decision",
      nextStep:
        "Verify the clinic signal before accepting, rejecting, or clearing this evidence from the queue.",
      impact:
        "Unverified status can create avoidable routing uncertainty for district operators and patients.",
      verification:
        "Use reporter, timestamp, and clinic evidence to decide whether this signal is trustworthy.",
      tone: "watch" satisfies EvidenceCommandTone,
    };
  }

  return {
    title: "Readiness confirmation decision",
    nextStep:
      "Validate this report against clinic context, then return to the queue with the evidence state resolved.",
    impact:
      "Confirmed operational reports reduce routing uncertainty and help keep the command view current.",
    verification:
      "Check that the report source and received time are consistent with the current clinic state.",
    tone: "stable" satisfies EvidenceCommandTone,
  };
}

export function buildLeadDecisionCopy({
  interest,
  status,
}: {
  interest: string;
  status: string;
}): EvidenceCommandDecisionCopy {
  if (status === "new") {
    return {
      title: "Initial qualification decision",
      nextStep:
        "Confirm the stakeholder need, route the lead to the right owner, and decide whether a walkthrough is warranted.",
      impact:
        "Untriaged stakeholder interest can blur whether this is a district operations buyer, partner, operator, or investor path.",
      verification:
        `Use the ${formatEvidenceLabel(interest)} focus and note to decide the next owner before changing status.`,
      tone: "attention" satisfies EvidenceCommandTone,
    };
  }

  if (status === "scheduled") {
    return {
      title: "Scheduled follow-up decision",
      nextStep:
        "Prepare the relevant workflow evidence and contact the stakeholder with the next concrete agenda.",
      impact:
        "A scheduled lead needs a sharper handoff than a generic activity record so the demo maps to their operating context.",
      verification:
        `Use the ${formatEvidenceLabel(interest)} focus to choose which operations proof points to lead with.`,
      tone: "info" satisfies EvidenceCommandTone,
    };
  }

  if (status === "completed") {
    return {
      title: "Closeout decision",
      nextStep:
        "Confirm whether follow-up is complete, then keep the stakeholder record available for audit and pipeline context.",
      impact:
        "Completed follow-up should still preserve why the stakeholder mattered and what evidence supported the outcome.",
      verification:
        "Check that the note captures the operational reason this lead was kept in the admin activity queue.",
      tone: "stable" satisfies EvidenceCommandTone,
    };
  }

  return {
    title: "Follow-up decision",
    nextStep:
      "Review the stakeholder context, contact the lead, and update the activity queue when the next step is clear.",
    impact:
      "Contacted leads need a clear next action so the admin surface does not become a passive address book.",
    verification:
      `Use the ${formatEvidenceLabel(interest)} focus and current status to decide the next queue action.`,
    tone: "info" satisfies EvidenceCommandTone,
  };
}
