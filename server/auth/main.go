package main

import (
	"os"

	"github.com/SneaX-23/StateFile/server/auth/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	secret := os.Getenv("BETTER_AUTH_SECRET")
	if secret == "" {
		panic("BETTER_AUTH_SECRET environment variable is required")
	}

	r := gin.New()
	r.Use(gin.Recovery(), middleware.SecurityHeaders())

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	authMiddleware := middleware.NewAuthMiddleware(secret)

	api := r.Group("/api/v1")
	api.Use(authMiddleware.Authenticate())

	r.Run(":8080")
}
