export type ClinicOperatingStatus = "operational" | "degraded" | "non_functional" | "unknown";
export type ClinicStatusInput = ClinicOperatingStatus | "non-functional";

export type ClinicStatusCopy = {
  label: string;
  description: string;
};

export const clinicOperatingStatuses = [
  "operational",
  "degraded",
  "non_functional",
  "unknown",
] as const satisfies readonly ClinicOperatingStatus[];

const clinicStatusCopy: Record<ClinicOperatingStatus, ClinicStatusCopy> = {
  operational: {
    label: "Operational",
    description: "Clinic is open and delivering expected services.",
  },
  degraded: {
    label: "Degraded",
    description: "Clinic is operating with a service or staffing issue.",
  },
  non_functional: {
    label: "Non-functional",
    description: "Clinic is unavailable for normal patient routing.",
  },
  unknown: {
    label: "Unknown",
    description: "Current clinic operating status has not been confirmed.",
  },
};

export function normalizeClinicStatus(status: ClinicStatusInput): ClinicOperatingStatus {
  return status === "non-functional" ? "non_functional" : status;
}

export function getClinicStatusCopy(status: ClinicStatusInput): ClinicStatusCopy {
  return clinicStatusCopy[normalizeClinicStatus(status)];
}
