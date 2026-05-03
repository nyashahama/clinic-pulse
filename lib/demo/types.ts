export type ClinicStatus =
  | "operational"
  | "degraded"
  | "non_functional"
  | "unknown";

export type Freshness = "fresh" | "needs_confirmation" | "stale" | "unknown";
export type StaffPressure = "normal" | "strained" | "critical" | "unknown";
export type StockPressure = "normal" | "low" | "stockout" | "unknown";
export type QueuePressure = "low" | "moderate" | "high" | "unknown";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type DemoRole =
  | "founder_admin"
  | "district_manager"
  | "field_worker"
  | "clinic_coordinator"
  | "public_user"
  | "partner_api";

export type Clinic = {
  id: string;
  name: string;
  facilityCode: string;
  province: string;
  district: string;
  latitude: number;
  longitude: number;
  services: string[];
  operatingHours: string;
  imageKey: DemoImageKey;
};

export type ClinicCurrentState = {
  clinicId: string;
  status: ClinicStatus;
  reason: string;
  freshness: Freshness;
  lastReportedAt: string;
  reporterName: string;
  source: "field_worker" | "clinic_coordinator" | "demo_control" | "seed";
  staffPressure: StaffPressure;
  stockPressure: StockPressure;
  queuePressure: QueuePressure;
};

export type ReportEvent = {
  id: string;
  clinicId: string;
  reporterName: string;
  source: "field_worker" | "clinic_coordinator" | "demo_control" | "seed";
  offlineCreated: boolean;
  submittedAt: string;
  receivedAt: string;
  status: ClinicStatus;
  reason: string;
  staffPressure: StaffPressure;
  stockPressure: StockPressure;
  queuePressure: QueuePressure;
  notes: string;
};

export type Alert = {
  id: string;
  clinicId: string;
  type:
    | "clinic_down"
    | "stockout"
    | "staffing_shortage"
    | "queue_overload"
    | "stale_data"
    | "conflicting_reports"
    | "offline_queue_delay";
  severity: AlertSeverity;
  status: "open" | "acknowledged" | "resolved";
  recommendedAction: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  clinicId: string;
  actorName: string;
  eventType:
    | "demo.reset"
    | "demo.stockout_triggered"
    | "demo.staffing_shortage_triggered"
    | "demo.offline_sync_triggered"
    | "clinic.status_changed"
    | "clinic.status_marked_stale"
    | "report.submitted"
    | "report.reviewed"
    | "report.received_offline"
    | "report.synced"
    | "alert.created"
    | "routing.alternative_recommended"
    | "lead.demo_requested"
    | "export.preview_opened"
    | "api.preview_opened";
  summary: string;
  createdAt: string;
};

export type DemoLead = {
  id: string;
  name: string;
  workEmail: string;
  organization: string;
  role: string;
  interest: "government" | "ngo" | "investor" | "clinic_operator" | "other";
  note: string;
  createdAt: string;
  status: "new" | "contacted" | "scheduled" | "completed";
};

export type DemoImageKey =
  | "clinic-front-01"
  | "clinic-front-02"
  | "mobile-field-report"
  | "district-operations-room"
  | "patient-routing-context";

export type DemoImageAsset = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
};

export type DemoScenario = "reset" | "stockout" | "staffing_shortage" | "offline_sync";

export type QueuedOfflineReport = Omit<ReportEvent, "receivedAt"> & {
  queuedAt: string;
  syncStatus: "queued";
};

export type QueueOfflineReportInput = Omit<
  ReportEvent,
  "id" | "submittedAt" | "receivedAt" | "offlineCreated"
> & {
  submittedAt?: string;
};

export type SubmitFieldReportInput = Omit<
  ReportEvent,
  "id" | "submittedAt" | "receivedAt" | "offlineCreated"
> & {
  receivedAt?: string;
  submittedAt?: string;
  offlineCreated?: boolean;
};

export type AddDemoLeadInput = Omit<DemoLead, "id" | "createdAt" | "status"> & {
  createdAt?: string;
  status?: DemoLead["status"];
};

export type DemoState = {
  province: string;
  district: string;
  clinics: Clinic[];
  clinicStates: ClinicCurrentState[];
  reports: ReportEvent[];
  alerts: Alert[];
  auditEvents: AuditEvent[];
  leads: DemoLead[];
  role: DemoRole;
  offlineQueue: QueuedOfflineReport[];
  lastSyncAt: string | null;
};

export type ClinicRow = Clinic &
  ClinicCurrentState & {
    image: DemoImageAsset;
  };

export type ReportStreamItem = ReportEvent & {
  clinicName: string;
  facilityCode: string;
};
