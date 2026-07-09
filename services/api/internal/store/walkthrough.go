package store

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"

	"clinicpulse/services/api/internal/store/db"
)

func (s Store) CreateWalkthroughRequest(ctx context.Context, input CreateWalkthroughRequestInput) (WalkthroughRequest, error) {
	row, err := s.db.CreateWalkthroughRequest(ctx, &db.CreateWalkthroughRequestParams{
		Name:            input.Name,
		WorkEmail:       input.WorkEmail,
		Organization:    input.Organization,
		Role:            input.Role,
		Interest:        input.Interest,
		Note:            input.Note,
		RequestedDate:   pgtype.Date{Time: input.RequestedDate, Valid: true},
		RequestedTime:   input.RequestedTime,
		DurationMinutes: int32(input.DurationMinutes),
	})
	if err != nil {
		return WalkthroughRequest{}, err
	}
	return walkthroughRequestFromRow(*row), nil
}

func walkthroughRequestFromRow(r db.WalkthroughRequest) WalkthroughRequest {
	return WalkthroughRequest{
		ID:              r.ID,
		Name:            r.Name,
		WorkEmail:       r.WorkEmail,
		Organization:    r.Organization,
		Role:            r.Role,
		Interest:        r.Interest,
		Note:            r.Note,
		RequestedDate:   r.RequestedDate.Time,
		RequestedTime:   r.RequestedTime,
		DurationMinutes: int(r.DurationMinutes),
		Status:          r.Status,
		CreatedAt:       r.CreatedAt.Time,
	}
}
