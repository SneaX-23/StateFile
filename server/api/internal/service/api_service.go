package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/SneaX-23/StateFile/server/api/internal/repository"
	"github.com/SneaX-23/StateFile/server/api/internal/util"
)

type ApiService struct {
	repo ApiRepository
}

func NewApiService(repo ApiRepository) *ApiService {
	return &ApiService{repo: repo}
}

// a generic struct to standardize github and gitlab responses
type Repository struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Stars int64  `json:"stars"`
	Forks int64  `json:"forks"`
}

// GetReposService fetches repositories for a given user from their connected provider
func (s *ApiService) GetReposService(ctx context.Context, userId string, page int) ([]Repository, bool, error) {
	// retrieve the access token from the repository
	account, err := s.repo.GetAccessToken(ctx, userId)
	if err != nil {
		return nil, false, err
	}
	if account.AccessToken == nil {
		return nil, false, errors.New("access token is null")
	}

	// decrypt the token using the BETTER_AUTH_SECRET environment variable
	decryptedToken, err := util.DecryptBetterAuthAccessToken(*account.AccessToken, os.Getenv("BETTER_AUTH_SECRET"))
	if err != nil {
		return nil, false, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	var repos []Repository
	var hasMore bool

	// check provider type to determine which API to call
	switch account.ProviderId {
	case "github":
		githubUrl := fmt.Sprintf("https://api.github.com/user/repos?type=owner&sort=updated&direction=desc&per_page=50&page=%d", page)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubUrl, nil)
		if err != nil {
			return nil, false, err
		}

		// set required github headers
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("Authorization", "Bearer "+decryptedToken)
		req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

		resp, err := client.Do(req)
		if err != nil {
			return nil, false, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, false, fmt.Errorf("GitHub API returned status %s", resp.Status)
		}

		// struct to capture github specific JSON keys
		type GitHubRepo struct {
			ID    int64  `json:"id"`
			Name  string `json:"name"`
			Stars int64  `json:"stargazers_count"`
			Forks int64  `json:"forks_count"`
		}

		var githubRepos []GitHubRepo
		if err := json.NewDecoder(resp.Body).Decode(&githubRepos); err != nil {
			return nil, false, err
		}

		// map to generic Repository
		for _, r := range githubRepos {
			repos = append(repos, Repository{
				ID:    r.ID,
				Name:  r.Name,
				Stars: r.Stars,
				Forks: r.Forks,
			})
		}

		// check the Link header for pagination
		linkHeader := resp.Header.Get("Link")
		hasMore = strings.Contains(linkHeader, `rel="next"`)

	case "gitlab":
		gitlabUrl := fmt.Sprintf("https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at&sort=desc&per_page=50&page=%d", page)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, gitlabUrl, nil)
		if err != nil {
			return nil, false, err
		}

		// set required gitlab headers
		req.Header.Set("Authorization", "Bearer "+decryptedToken)

		resp, err := client.Do(req)
		if err != nil {
			return nil, false, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, false, fmt.Errorf("GitLab API returned status %s", resp.Status)
		}

		// struct to capture gitlab specific JSON keys
		type GitLabProject struct {
			ID    int64  `json:"id"`
			Name  string `json:"name"`
			Stars int64  `json:"star_count"`
			Forks int64  `json:"forks_count"`
		}

		var gitlabProjects []GitLabProject
		if err := json.NewDecoder(resp.Body).Decode(&gitlabProjects); err != nil {
			return nil, false, err
		}

		// map to generic Repository
		for _, p := range gitlabProjects {
			repos = append(repos, Repository{
				ID:    p.ID,
				Name:  p.Name,
				Stars: p.Stars,
				Forks: p.Forks,
			})
		}

		hasMore = resp.Header.Get("x-next-page") != ""

	default:
		return nil, false, errors.New("unsupported provider")
	}

	return repos, hasMore, nil
}

type Repositories struct {
	Id   int64  `json:"id"`
	Name string `json:"name"`
}

func (s *ApiService) ImportReposService(ctx context.Context, userId string, repos []Repositories) (int64, error) {
	repoLimit, err := s.repo.CheckRepoLimit(ctx, userId)
	if err != nil {
		return 0, err
	}
	if repoLimit <= 0 || len(repos) > int(repoLimit) {
		return 0, fmt.Errorf("repo import limit reached")
	}
	var repoInserted int64

	err = s.repo.ExecTx(ctx, func(q *repository.Queries) error {
		newLimit, err := q.DecrementRepoLimit(ctx, repository.DecrementRepoLimitParams{
			AllowedRepos: int32(len(repos)),
			UserId:       userId,
		})
		if err != nil {
			return err
		}
		log.Printf("allowedRepos after decrement: %d", newLimit)
		params := make([]repository.AddReposParams, len(repos))
		for i, repo := range repos {
			params[i] = repository.AddReposParams{
				UserId:       userId,
				GithubRepoId: repo.Id,
				RepoName:     repo.Name,
			}
		}

		inserted, err := q.AddRepos(ctx, params)
		if err != nil {
			return err
		}

		repoInserted = inserted
		return nil
	})
	if err != nil {
		return 0, err
	}

	return repoInserted, nil
}
