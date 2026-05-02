package http

import (
	nethttp "net/http"

	"github.com/go-chi/chi/v5"
)

func NewRouter() nethttp.Handler {
	router := chi.NewRouter()
	router.Get("/healthz", Healthz)

	return router
}
