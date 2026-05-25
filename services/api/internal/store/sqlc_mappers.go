package store

import (
	"time"

	"clinicpulse/services/api/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

func userFromSQLC(row db.User) User {
	return User{
		ID:                    row.ID,
		Email:                 row.Email,
		DisplayName:           row.DisplayName,
		PasswordHash:          row.PasswordHash,
		DisabledAt:            optionalTimeFromSQLC(row.DisabledAt),
		PasswordChangedAt:     optionalTimeFromSQLC(row.PasswordChangedAt),
		PasswordResetRequired: row.PasswordResetRequired,
		CreatedAt:             timeFromSQLC(row.CreatedAt),
		UpdatedAt:             timeFromSQLC(row.UpdatedAt),
	}
}

func timestamptzFromTime(value time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: value, Valid: !value.IsZero()}
}

func timeFromSQLC(value pgtype.Timestamptz) time.Time {
	if !value.Valid {
		return time.Time{}
	}
	return value.Time
}

func optionalTimeFromSQLC(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	result := value.Time
	return &result
}
