package service

import (
	"context"

	"github.com/SneaX-23/StateFile/server/api/internal/repository"
)

type ApiRepository interface {
	GetAccessToken(ctx context.Context, userid string) (repository.GetAccessTokenRow, error)
	CheckRepoLimit(ctx context.Context, userid string) (int32, error)
	AddRepos(ctx context.Context, arg []repository.AddReposParams) (int64, error)
	DecrementRepoLimit(ctx context.Context, arg repository.DecrementRepoLimitParams) (int32, error)
	ExecTx(ctx context.Context, fn func(*repository.Queries) error) error
}
