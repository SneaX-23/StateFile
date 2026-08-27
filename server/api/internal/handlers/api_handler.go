package handlers

import (
	"net/http"
	"strconv"

	"github.com/SneaX-23/StateFile/server/api/internal/service"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	apiService *service.ApiService
}

func NewHandler(apiService *service.ApiService) *Handler {
	return &Handler{
		apiService: apiService,
	}
}

func (h *Handler) GetRepos(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}
	userIdStr := userId.(string)

	pageStr := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page number"})
		return
	}

	repos, hasMore, err := h.apiService.GetReposService(c.Request.Context(), userIdStr, page)
	if err != nil {
		// todo: implement more granular error checking
		// to return 401s vs 500s
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"repositories": repos,
		"hasMore":      hasMore,
	})
}
