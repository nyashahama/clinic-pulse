package store

import "time"

type Clinic struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	FacilityCode       string     `json:"facilityCode"`
	Province           string     `json:"province"`
	District           string     `json:"district"`
	Latitude           *float64   `json:"latitude,omitempty"`
	Longitude          *float64   `json:"longitude,omitempty"`
	OperatingHours     *string    `json:"operatingHours,omitempty"`
	FacilityType       string     `json:"facilityType"`
	VerificationStatus string     `json:"verificationStatus"`
	LastVerifiedAt     *time.Time `json:"lastVerifiedAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type ClinicService struct {
	ClinicID            string     `json:"clinicId"`
	ServiceName         string     `json:"serviceName"`
	CurrentAvailability string     `json:"currentAvailability"`
	ConfidenceScore     *float64   `json:"confidenceScore,omitempty"`
	LastVerifiedAt      *time.Time `json:"lastVerifiedAt,omitempty"`
}

type CurrentStatus struct {
	ClinicID        string     `json:"clinicId"`
	Status          string     `json:"status"`
	Reason          *string    `json:"reason,omitempty"`
	Freshness       string     `json:"freshness"`
	LastReportedAt  *time.Time `json:"lastReportedAt,omitempty"`
	ReporterName    *string    `json:"reporterName,omitempty"`
	Source          *string    `json:"source,omitempty"`
	StaffPressure   *string    `json:"staffPressure,omitempty"`
	StockPressure   *string    `json:"stockPressure,omitempty"`
	QueuePressure   *string    `json:"queuePressure,omitempty"`
	ConfidenceScore *float64   `json:"confidenceScore,omitempty"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type Report struct {
	ID                int64      `json:"id"`
	ExternalID        *string    `json:"externalId,omitempty"`
	ClinicID          string     `json:"clinicId"`
	ReporterName      *string    `json:"reporterName,omitempty"`
	Source            string     `json:"source"`
	OfflineCreated    bool       `json:"offlineCreated"`
	SubmittedAt       time.Time  `json:"submittedAt"`
	ReceivedAt        time.Time  `json:"receivedAt"`
	Status            string     `json:"status"`
	Reason            *string    `json:"reason,omitempty"`
	StaffPressure     *string    `json:"staffPressure,omitempty"`
	StockPressure     *string    `json:"stockPressure,omitempty"`
	QueuePressure     *string    `json:"queuePressure,omitempty"`
	Notes             *string    `json:"notes,omitempty"`
	ReviewState       string     `json:"reviewState"`
	ConfidenceScore   *float64   `json:"confidenceScore,omitempty"`
	SubmittedByUserID *int64     `json:"submittedByUserId,omitempty"`
	ReviewedByUserID  *int64     `json:"reviewedByUserId,omitempty"`
	ReviewedAt        *time.Time `json:"reviewedAt,omitempty"`
	ReviewNotes       *string    `json:"reviewNotes,omitempty"`
}

type ReportSyncAttempt struct {
	ID                 int64          `json:"id"`
	ExternalID         string         `json:"externalId"`
	ReportID           *int64         `json:"reportId,omitempty"`
	SubmittedByUserID  *int64         `json:"submittedByUserId,omitempty"`
	OrganisationID     *int64         `json:"organisationId,omitempty"`
	ClinicID           string         `json:"clinicId"`
	Result             string         `json:"result"`
	ClientAttemptCount int            `json:"clientAttemptCount"`
	QueuedAt           *time.Time     `json:"queuedAt,omitempty"`
	SubmittedAt        *time.Time     `json:"submittedAt,omitempty"`
	ReceivedAt         time.Time      `json:"receivedAt"`
	ErrorCode          *string        `json:"errorCode,omitempty"`
	ErrorMessage       *string        `json:"errorMessage,omitempty"`
	Metadata           map[string]any `json:"metadata,omitempty"`
}

type CreateReportSyncAttemptInput struct {
	ExternalID         string
	ReportID           *int64
	SubmittedByUserID  *int64
	OrganisationID     *int64
	ClinicID           string
	Result             string
	ClientAttemptCount int
	QueuedAt           *time.Time
	SubmittedAt        *time.Time
	ReceivedAt         time.Time
	ErrorCode          *string
	ErrorMessage       *string
	Metadata           map[string]any
}

type SyncSummary struct {
	WindowStartedAt             time.Time `json:"windowStartedAt"`
	OfflineReportsReceived      int       `json:"offlineReportsReceived"`
	DuplicateSyncsHandled       int       `json:"duplicateSyncsHandled"`
	ConflictsNeedingAttention   int       `json:"conflictsNeedingAttention"`
	ValidationFailures          int       `json:"validationFailures"`
	PendingOfflineReports       int       `json:"pendingOfflineReports"`
	NeedsConfirmationClinics    int       `json:"needsConfirmationClinics"`
	StaleClinics                int       `json:"staleClinics"`
	MedianCurrentStatusAgeHours *float64  `json:"medianCurrentStatusAgeHours,omitempty"`
}

type PartnerAPIKey struct {
	ID               int64          `json:"id"`
	OrganisationID   *int64         `json:"organisationId,omitempty"`
	Name             string         `json:"name"`
	Environment      string         `json:"environment"`
	KeyPrefix        string         `json:"keyPrefix"`
	KeyHash          string         `json:"-"`
	Scopes           []string       `json:"scopes"`
	AllowedDistricts []string       `json:"allowedDistricts"`
	ExpiresAt        *time.Time     `json:"expiresAt,omitempty"`
	RevokedAt        *time.Time     `json:"revokedAt,omitempty"`
	LastUsedAt       *time.Time     `json:"lastUsedAt,omitempty"`
	LastUsedIP       *string        `json:"lastUsedIp,omitempty"`
	CreatedByUserID  *int64         `json:"createdByUserId,omitempty"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	Metadata         map[string]any `json:"metadata,omitempty"`
}

type CreatePartnerAPIKeyInput struct {
	OrganisationID   *int64
	Name             string
	Environment      string
	KeyPrefix        string
	KeyHash          string
	Scopes           []string
	AllowedDistricts []string
	ExpiresAt        *time.Time
	CreatedByUserID  *int64
	CreatedAt        time.Time
}

type PartnerWebhookSubscription struct {
	ID              int64      `json:"id"`
	OrganisationID  *int64     `json:"organisationId,omitempty"`
	Name            string     `json:"name"`
	TargetURL       string     `json:"targetUrl"`
	EventTypes      []string   `json:"eventTypes"`
	SecretHash      string     `json:"-"`
	Status          string     `json:"status"`
	LastTestedAt    *time.Time `json:"lastTestedAt,omitempty"`
	LastTestStatus  *string    `json:"lastTestStatus,omitempty"`
	LastError       *string    `json:"lastError,omitempty"`
	CreatedByUserID *int64     `json:"createdByUserId,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type CreatePartnerWebhookSubscriptionInput struct {
	OrganisationID  *int64
	Name            string
	TargetURL       string
	EventTypes      []string
	SecretHash      string
	Status          string
	CreatedByUserID *int64
	CreatedAt       time.Time
}

type PartnerWebhookEvent struct {
	ID             int64          `json:"id"`
	SubscriptionID int64          `json:"subscriptionId"`
	EventType      string         `json:"eventType"`
	Payload        map[string]any `json:"payload"`
	Status         string         `json:"status"`
	AttemptCount   int            `json:"attemptCount"`
	LastError      *string        `json:"lastError,omitempty"`
	CreatedAt      time.Time      `json:"createdAt"`
	DeliveredAt    *time.Time     `json:"deliveredAt,omitempty"`
}

type CreatePartnerWebhookEventInput struct {
	SubscriptionID int64
	EventType      string
	Payload        map[string]any
	Status         string
	AttemptCount   int
	LastError      *string
	CreatedAt      time.Time
	DeliveredAt    *time.Time
}

type PartnerExportRun struct {
	ID                int64          `json:"id"`
	OrganisationID    *int64         `json:"organisationId,omitempty"`
	RequestedByUserID *int64         `json:"requestedByUserId,omitempty"`
	Format            string         `json:"format"`
	Scope             map[string]any `json:"scope"`
	RecordCounts      map[string]any `json:"recordCounts"`
	Checksum          string         `json:"checksum"`
	Payload           map[string]any `json:"payload"`
	CreatedAt         time.Time      `json:"createdAt"`
}

type CreatePartnerExportRunInput struct {
	OrganisationID    *int64
	RequestedByUserID *int64
	Format            string
	Scope             map[string]any
	RecordCounts      map[string]any
	Checksum          string
	Payload           map[string]any
	CreatedAt         time.Time
}

type IntegrationStatusCheck struct {
	ID             int64          `json:"id"`
	OrganisationID *int64         `json:"organisationId,omitempty"`
	CheckName      string         `json:"checkName"`
	Status         string         `json:"status"`
	Summary        string         `json:"summary"`
	Metadata       map[string]any `json:"metadata"`
	CheckedAt      time.Time      `json:"checkedAt"`
}

type UpsertIntegrationStatusCheckInput struct {
	OrganisationID *int64
	CheckName      string
	Status         string
	Summary        string
	Metadata       map[string]any
	CheckedAt      time.Time
}

type PartnerReadinessSnapshot struct {
	APIKeys              []PartnerAPIKey              `json:"apiKeys"`
	WebhookSubscriptions []PartnerWebhookSubscription `json:"webhookSubscriptions"`
	WebhookEvents        []PartnerWebhookEvent        `json:"webhookEvents"`
	ExportRuns           []PartnerExportRun           `json:"exportRuns"`
	IntegrationChecks    []IntegrationStatusCheck     `json:"integrationChecks"`
}

type AuditEvent struct {
	ID             int64          `json:"id"`
	ExternalID     *string        `json:"externalId,omitempty"`
	ClinicID       string         `json:"clinicId"`
	ActorName      *string        `json:"actorName,omitempty"`
	EventType      string         `json:"eventType"`
	Summary        string         `json:"summary"`
	CreatedAt      time.Time      `json:"createdAt"`
	ActorUserID    *int64         `json:"actorUserId,omitempty"`
	ActorRole      *string        `json:"actorRole,omitempty"`
	OrganisationID *int64         `json:"organisationId,omitempty"`
	EntityType     *string        `json:"entityType,omitempty"`
	EntityID       *string        `json:"entityId,omitempty"`
	Metadata       map[string]any `json:"metadata,omitempty"`
}

type User struct {
	ID           int64      `json:"id"`
	Email        string     `json:"email"`
	DisplayName  string     `json:"displayName"`
	PasswordHash *string    `json:"-"`
	DisabledAt   *time.Time `json:"disabledAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type Organisation struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type OrganisationMembership struct {
	ID             int64     `json:"id"`
	OrganisationID *int64    `json:"organisationId,omitempty"`
	UserID         int64     `json:"userId"`
	Role           string    `json:"role"`
	District       *string   `json:"district,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}

type Session struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"userId"`
	TokenHash  string     `json:"-"`
	CreatedAt  time.Time  `json:"createdAt"`
	ExpiresAt  time.Time  `json:"expiresAt"`
	RevokedAt  *time.Time `json:"revokedAt,omitempty"`
	LastSeenAt *time.Time `json:"lastSeenAt,omitempty"`
	UserAgent  *string    `json:"userAgent,omitempty"`
	IPAddress  *string    `json:"ipAddress,omitempty"`
}

type ClinicDetail struct {
	Clinic        Clinic          `json:"clinic"`
	Services      []ClinicService `json:"services"`
	CurrentStatus *CurrentStatus  `json:"currentStatus,omitempty"`
}

type CreateReportInput struct {
	ExternalID        *string   `json:"externalId,omitempty"`
	ClinicID          string    `json:"clinicId"`
	ReporterName      *string   `json:"reporterName,omitempty"`
	Source            string    `json:"source,omitempty"`
	OfflineCreated    bool      `json:"offlineCreated"`
	SubmittedAt       time.Time `json:"submittedAt,omitempty"`
	ReceivedAt        time.Time `json:"receivedAt,omitempty"`
	Status            string    `json:"status,omitempty"`
	Reason            *string   `json:"reason,omitempty"`
	StaffPressure     *string   `json:"staffPressure,omitempty"`
	StockPressure     *string   `json:"stockPressure,omitempty"`
	QueuePressure     *string   `json:"queuePressure,omitempty"`
	Notes             *string   `json:"notes,omitempty"`
	ReviewState       string    `json:"reviewState,omitempty"`
	ConfidenceScore   *float64  `json:"confidenceScore,omitempty"`
	Freshness         string    `json:"freshness,omitempty"`
	AuditExternalID   *string   `json:"auditExternalId,omitempty"`
	AuditEventType    string    `json:"auditEventType,omitempty"`
	AuditSummary      string    `json:"auditSummary,omitempty"`
	SubmittedByUserID *int64    `json:"submittedByUserId,omitempty"`
	AuditEvent        *CreateAuditEventInput
}

type ReviewReportInput struct {
	ReportID       int64
	ReviewerUserID int64
	OrganisationID *int64
	Decision       string
	Notes          *string
	Scope          ReportReviewScope
	AuditEvent     *CreateAuditEventInput
}

type ReportReviewScope struct {
	Role     string
	District *string
}

type CreateSessionInput struct {
	UserID    int64     `json:"userId"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
	UserAgent *string   `json:"userAgent,omitempty"`
	IPAddress *string   `json:"ipAddress,omitempty"`
}

type CreateSessionWithAuditInput struct {
	Session    CreateSessionInput
	AuditEvent CreateAuditEventInput
}

type CreateAuditEventInput struct {
	ExternalID     *string
	ClinicID       *string
	ActorName      *string
	EventType      string
	Summary        string
	CreatedAt      time.Time
	ActorUserID    *int64
	ActorRole      *string
	OrganisationID *int64
	EntityType     *string
	EntityID       *string
	Metadata       map[string]any
}
