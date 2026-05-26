import type {
  AuditEvent,
  ClinicStatus,
  Freshness,
  QueuePressure,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";
import type { FieldLocationVerification } from "@/lib/demo/field-location-verification";
import type { OfflineSyncApiResult } from "@/lib/demo/offline-sync-types";
import type { AuthMembership, AuthRole } from "@/lib/auth/api";

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

export type PublicCurrentStatusApiResponse = Omit<
  CurrentStatusApiResponse,
  "reporterName" | "source"
>;

export type ClinicDetailApiResponse = {
  clinic: ClinicApiResponse;
  services: ClinicServiceApiResponse[];
  currentStatus?: ApiNullable<CurrentStatusApiResponse>;
};

export type PublicClinicDetailApiResponse = Omit<ClinicDetailApiResponse, "currentStatus"> & {
  currentStatus?: ApiNullable<PublicCurrentStatusApiResponse>;
};

export type ReportReviewState = "pending" | "accepted" | "rejected";

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
  reviewState: ReportReviewState | string;
  confidenceScore?: ApiNullable<number>;
  visitVerification?: ApiNullable<FieldLocationVerification>;
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

export type AdminUserAccessApiResponse = {
  userId: number;
  email: string;
  displayName: string;
  disabledAt?: ApiNullable<string>;
  createdAt: string;
  role: AuthRole | string;
  organisationId?: ApiNullable<number>;
  district?: ApiNullable<string>;
  lastSeenAt?: ApiNullable<string>;
};

export type AdminUserApiResponse = {
  id: number;
  email: string;
  displayName: string;
  disabledAt?: ApiNullable<string>;
  passwordChangedAt?: ApiNullable<string>;
  passwordResetRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserApiInput = {
  email: string;
  displayName: string;
  role: AuthRole;
  organisationId?: ApiNullable<number>;
  district?: ApiNullable<string>;
};

export type CreateAdminUserApiResponse = {
  user: AdminUserApiResponse;
  access: AuthMembership;
  temporaryPassword: string;
};

export type UpdateAdminUserApiInput = {
  displayName?: string;
  disabled?: boolean;
};

export type UpdateAdminUserApiResponse = {
  user: AdminUserApiResponse;
};

export type UpdateAdminUserAccessApiInput = {
  role: AuthRole;
  organisationId?: ApiNullable<number>;
  district?: ApiNullable<string>;
};

export type UpdateAdminUserAccessApiResponse = {
  access: AuthMembership;
};

export type RevokeAdminUserSessionsApiResponse = {
  revokedSessions: number;
};

export type AdminAuditEventApiResponse = AuditEventApiResponse & {
  actorUserId?: ApiNullable<number>;
  actorRole?: ApiNullable<AuthRole | string>;
  organisationId?: ApiNullable<number>;
  entityType?: ApiNullable<string>;
  entityId?: ApiNullable<string>;
  metadata?: ApiNullable<Record<string, unknown>>;
};

export type AlternativeApiResponse = {
  clinic: PublicClinicDetailApiResponse;
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
  visitVerification?: FieldLocationVerification | null;
};

export type CreateReportApiResponse = {
  report: ReportApiResponse;
  created: boolean;
  currentStatus?: CurrentStatusApiResponse;
  auditEvent?: AuditEventApiResponse;
};

export type ReviewReportApiInput = {
  decision: "accepted" | "rejected";
  notes?: string;
};

export type ReviewReportApiResponse = {
  report: ReportApiResponse;
  currentStatus?: CurrentStatusApiResponse;
};

export type OfflineSyncApiRequest = {
  items: Array<{
    clientReportId: string;
    clinicId: string;
    status: ClinicStatus;
    reason: string;
    staffPressure: StaffPressure;
    stockPressure: StockPressure;
    queuePressure: QueuePressure;
    notes: string;
    submittedAt: string;
    queuedAt: string;
    attemptCount: number;
    visitVerification?: FieldLocationVerification | null;
  }>;
};

export type OfflineSyncApiResponse = {
  results: OfflineSyncApiResult[];
  summary: {
    created: number;
    duplicate: number;
    conflict: number;
    failed: number;
  };
};

export type SyncSummaryApiResponse = {
  windowStartedAt: string;
  offlineReportsReceived: number;
  duplicateSyncsHandled: number;
  conflictsNeedingAttention: number;
  validationFailures: number;
  pendingOfflineReports: number;
  needsConfirmationClinics: number;
  staleClinics: number;
  medianCurrentStatusAgeHours?: number | null;
};

export type StalenessReconciliationApiResponse = {
  checked: number;
  markedNeedsConfirmation: number;
  markedStale: number;
};

export type PartnerApiKeyApiResponse = {
  id: number;
  organisationId?: ApiNullable<number>;
  name: string;
  environment: string;
  keyPrefix: string;
  scopes: string[];
  allowedDistricts: string[];
  expiresAt?: ApiNullable<string>;
  revokedAt?: ApiNullable<string>;
  lastUsedAt?: ApiNullable<string>;
  lastUsedIp?: ApiNullable<string>;
  createdByUserId?: ApiNullable<number>;
  createdAt: string;
  updatedAt: string;
};

export type CreatePartnerApiKeyApiInput = {
  name: string;
  environment: "demo" | "live";
  scopes: string[];
  allowedDistricts?: string[];
  expiresAt?: ApiNullable<string>;
};

export type CreatePartnerApiKeyApiResponse = {
  apiKey: PartnerApiKeyApiResponse;
  secret: string;
};

export type PartnerWebhookSubscriptionApiResponse = {
  id: number;
  organisationId?: ApiNullable<number>;
  name: string;
  targetUrl: string;
  eventTypes: string[];
  status: string;
  lastTestedAt?: ApiNullable<string>;
  lastTestStatus?: ApiNullable<string>;
  lastTestMetadata: Record<string, unknown>;
  lastError?: ApiNullable<string>;
  createdByUserId?: ApiNullable<number>;
  createdAt: string;
  updatedAt: string;
};

export type PartnerWebhookEventApiResponse = {
  id: number;
  subscriptionId: number;
  eventType: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: string;
  attemptCount: number;
  lastError?: ApiNullable<string>;
  createdAt: string;
  deliveredAt?: ApiNullable<string>;
};

export type PartnerExportRunApiResponse = {
  id: number;
  organisationId?: ApiNullable<number>;
  requestedByUserId?: ApiNullable<number>;
  format: string;
  scope: Record<string, unknown>;
  recordCounts: Record<string, unknown>;
  checksum: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type IntegrationStatusCheckApiResponse = {
  id: number;
  organisationId?: ApiNullable<number>;
  checkName: string;
  status: string;
  summary: string;
  metadata: Record<string, unknown>;
  checkedAt: string;
};

export type PartnerReadinessApiResponse = {
  apiKeys: PartnerApiKeyApiResponse[];
  webhookSubscriptions: PartnerWebhookSubscriptionApiResponse[];
  webhookEvents: PartnerWebhookEventApiResponse[];
  exportRuns: PartnerExportRunApiResponse[];
  integrationChecks: IntegrationStatusCheckApiResponse[];
};

export type CreatePartnerWebhookApiInput = {
  name: string;
  targetUrl: string;
  eventTypes: string[];
};

export type CreatePartnerWebhookApiResponse = {
  subscription: PartnerWebhookSubscriptionApiResponse;
  secret: string;
};

export type CreatePartnerExportApiInput = {
  format: "json" | "csv";
  scope?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    fields?: string[];
  };
};
