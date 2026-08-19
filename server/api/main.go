package main

import (
	"os"

	"github.com/SneaX-23/StateFile/server/auth/config"
	"github.com/SneaX-23/StateFile/server/auth/internal/repository"
	"github.com/SneaX-23/StateFile/server/auth/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	secret := os.Getenv("BETTER_AUTH_SECRET")
	if secret == "" {
		panic("BETTER_AUTH_SECRET environment variable is required")
	}
	databseUrl := os.Getenv("DATABASE_URL")
	if databseUrl == "" {
		panic("DATABASE_URL environment variable is required")
	}

	db, err := config.NewDatabase(databseUrl)
	if err != nil {
		panic("failed to connect to databse")
	}
	defer db.Close()

	queries := repository.New(db.Pool)

	r := gin.New()
	r.Use(gin.Recovery(), middleware.SecurityHeaders())

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	api := r.Group("/api/v1")
	api.Use(middleware.Authenticate(queries))

	r.Run(":8080")
}
