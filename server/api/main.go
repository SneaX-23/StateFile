package main

import (
	"log"
	"os"

	"github.com/SneaX-23/StateFile/server/auth/config"
	"github.com/SneaX-23/StateFile/server/auth/internal/handlers"
	"github.com/SneaX-23/StateFile/server/auth/internal/repository"
	"github.com/SneaX-23/StateFile/server/auth/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Panicln("No .env file found")
	}
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
	handler := handlers.NewHandler(queries)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.SecurityHeaders())

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	api := r.Group("/api/v1")
	api.Use(middleware.Authenticate(queries))
	api.GET("/get-repos", handler.GetRepos)
	r.Run(":8080")
}
