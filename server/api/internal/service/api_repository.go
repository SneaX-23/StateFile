package service

import (
	"context"

	"github.com/SneaX-23/StateFile/server/api/internal/repository"
)

type ApiRepository interface {
	GetAccessToken(ctx context.Context, userid string) (repository.GetAccessTokenRow, error)
}
