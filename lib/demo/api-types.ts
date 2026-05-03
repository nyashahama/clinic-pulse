import type {
  AuditEvent,
  ClinicStatus,
  Freshness,
  QueuePressure,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";

export type ApiNullable<T> = T | null | undefined;

export type ClinicApiResponse = {
  id: string;
  name: string;
  facilityCode: string;
  province: string;
  district: string;
  latitude?: ApiNullable<number>;
  longitude?: ApiNullable<number>;
  operatingHours?: ApiNullable<string>;
  facilityType: string;
  verificationStatus: string;
  lastVerifiedAt?: ApiNullable<string>;
  createdAt: string;
  updatedAt: string;
};

export type ClinicServiceApiResponse = {
  clinicId: string;
  serviceName: string;
  currentAvailability: string;
  confidenceScore?: ApiNullable<number>;
  lastVerifiedAt?: ApiNullable<string>;
};

export type CurrentStatusApiResponse = {
  clinicId: string;
  status: ClinicStatus | string;
  reason?: ApiNullable<string>;
  freshness: Freshness | string;
  lastReportedAt?: ApiNullable<string>;
  reporterName?: ApiNullable<string>;
  source?: ApiNullable<string>;
  staffPressure?: ApiNullable<StaffPressure | string>;
  stockPressure?: ApiNullable<StockPressure | string>;
  queuePressure?: ApiNullable<QueuePressure | string>;
  confidenceScore?: ApiNullable<number>;
  updatedAt: string;
};

export type ClinicDetailApiResponse = {
  clinic: ClinicApiResponse;
  services: ClinicServiceApiResponse[];
  currentStatus?: ApiNullable<CurrentStatusApiResponse>;
};

export type ReportApiResponse = {
  id: number;
  externalId?: ApiNullable<string>;
  clinicId: string;
  reporterName?: ApiNullable<string>;
  source: string;
  offlineCreated: boolean;
  submittedAt: string;
  receivedAt: string;
  status: ClinicStatus | string;
  reason?: ApiNullable<string>;
  staffPressure?: ApiNullable<StaffPressure | string>;
  stockPressure?: ApiNullable<StockPressure | string>;
  queuePressure?: ApiNullable<QueuePressure | string>;
  notes?: ApiNullable<string>;
  reviewState: string;
  confidenceScore?: ApiNullable<number>;
};

export type AuditEventApiResponse = {
  id: number;
  externalId?: ApiNullable<string>;
  clinicId: string;
  actorName?: ApiNullable<string>;
  eventType: AuditEvent["eventType"] | string;
  summary: string;
  createdAt: string;
};

export type AlternativeApiResponse = {
  clinic: ClinicDetailApiResponse;
  distanceKm?: ApiNullable<number>;
  reasonCode: string;
  rankReason: string;
  matchedService: string;
};

export type CreateReportApiInput = {
  externalId?: string;
  clinicId: string;
  status: ClinicStatus;
  staffPressure: StaffPressure;
  stockPressure: StockPressure;
  queuePressure: QueuePressure;
  reason: string;
  source: "field_worker" | "clinic_coordinator" | "demo_control" | "seed";
  reporterName?: string;
  confidence?: number;
  confidenceScore?: number;
  offlineCreated?: boolean;
  submittedAt?: string;
  notes?: string;
};

export type CreateReportApiResponse = {
  report: ReportApiResponse;
  currentStatus: CurrentStatusApiResponse;
  auditEvent: AuditEventApiResponse;
};

export type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    fields?: string[];
  };
};
