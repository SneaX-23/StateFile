package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/SneaX-23/StateFile/server/auth/internal/repository"
	"github.com/SneaX-23/StateFile/server/auth/internal/util"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	queries *repository.Queries
}

func NewHandler(q *repository.Queries) *Handler {
	return &Handler{
		queries: q,
	}
}

func (h *Handler) GetRepos(c *gin.Context) {
	// get userId that middleware set
	userId, exists := c.Get("userId")
	// check if exists or not
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}
	// convert interface{} to string
	userIdStr := userId.(string)

	// get the encrypted github accesss token from the database
	encryptedToken, err := h.queries.GetAccessToken(c, userIdStr)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: no token found"})
		} else {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		}
		return
	}
	if encryptedToken == nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: token is null"})
		return
	}
	// decrypt the token using BETTER_AUTH_SECRET
	decryptedToken, err := util.DecryptBetterAuthAccessToken(*encryptedToken, os.Getenv("BETTER_AUTH_SECRET"))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to decrypt access token"})
		return
	}

	// create the github request using gin's request context
	req, err := http.NewRequestWithContext(c.Request.Context(), "GET", "https://api.github.com/user/repos", nil)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to build upstream request"})
		return
	}

	// set headers
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+decryptedToken)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	// send the request using a clean http client
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadGateway, gin.H{"error": "Failed to reach GitHub API"})
		return
	}
	defer resp.Body.Close()

	// handle github error responses
	if resp.StatusCode != http.StatusOK {
		c.AbortWithStatusJSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("GitHub API returned status %s", resp.Status)})
		return
	}

	// minimal struct to capture only the repo names
	type GitHubRepo struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
	}

	var githubRepos []GitHubRepo
	if err := json.NewDecoder(resp.Body).Decode(&githubRepos); err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse GitHub response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"repositories": githubRepos})
}
