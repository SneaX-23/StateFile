package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/SneaX-23/StateFile/server/api/config"
	"github.com/SneaX-23/StateFile/server/api/internal/handlers"
	"github.com/SneaX-23/StateFile/server/api/internal/repository"
	"github.com/SneaX-23/StateFile/server/api/internal/service"
	"github.com/SneaX-23/StateFile/server/api/middleware"

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

	store := repository.NewStore(db.Pool)
	service := service.NewApiService(store)
	handler := handlers.NewHandler(service)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.SecurityHeaders())

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	api := r.Group("/api/v1")
	api.Use(middleware.Authenticate(store.Queries))
	api.GET("/get-repos", handler.GetRepos)
	api.POST("/import-repos", handler.ImportRepos)

	r.Run(":8080")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
}
