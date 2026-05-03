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
	ID              int64     `json:"id"`
	ExternalID      *string   `json:"externalId,omitempty"`
	ClinicID        string    `json:"clinicId"`
	ReporterName    *string   `json:"reporterName,omitempty"`
	Source          string    `json:"source"`
	OfflineCreated  bool      `json:"offlineCreated"`
	SubmittedAt     time.Time `json:"submittedAt"`
	ReceivedAt      time.Time `json:"receivedAt"`
	Status          string    `json:"status"`
	Reason          *string   `json:"reason,omitempty"`
	StaffPressure   *string   `json:"staffPressure,omitempty"`
	StockPressure   *string   `json:"stockPressure,omitempty"`
	QueuePressure   *string   `json:"queuePressure,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	ReviewState     string    `json:"reviewState"`
	ConfidenceScore *float64  `json:"confidenceScore,omitempty"`
}

type AuditEvent struct {
	ID         int64     `json:"id"`
	ExternalID *string   `json:"externalId,omitempty"`
	ClinicID   string    `json:"clinicId"`
	ActorName  *string   `json:"actorName,omitempty"`
	EventType  string    `json:"eventType"`
	Summary    string    `json:"summary"`
	CreatedAt  time.Time `json:"createdAt"`
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
	ExternalID      *string   `json:"externalId,omitempty"`
	ClinicID        string    `json:"clinicId"`
	ReporterName    *string   `json:"reporterName,omitempty"`
	Source          string    `json:"source,omitempty"`
	OfflineCreated  bool      `json:"offlineCreated"`
	SubmittedAt     time.Time `json:"submittedAt,omitempty"`
	ReceivedAt      time.Time `json:"receivedAt,omitempty"`
	Status          string    `json:"status,omitempty"`
	Reason          *string   `json:"reason,omitempty"`
	StaffPressure   *string   `json:"staffPressure,omitempty"`
	StockPressure   *string   `json:"stockPressure,omitempty"`
	QueuePressure   *string   `json:"queuePressure,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	ReviewState     string    `json:"reviewState,omitempty"`
	ConfidenceScore *float64  `json:"confidenceScore,omitempty"`
	Freshness       string    `json:"freshness,omitempty"`
	AuditExternalID *string   `json:"auditExternalId,omitempty"`
	AuditEventType  string    `json:"auditEventType,omitempty"`
	AuditSummary    string    `json:"auditSummary,omitempty"`
}

type CreateSessionInput struct {
	UserID    int64     `json:"userId"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expiresAt"`
	UserAgent *string   `json:"userAgent,omitempty"`
	IPAddress *string   `json:"ipAddress,omitempty"`
}
