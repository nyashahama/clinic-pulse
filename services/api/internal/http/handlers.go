package http

import nethttp "net/http"

func Healthz(w nethttp.ResponseWriter, r *nethttp.Request) {
	RespondJSON(w, nethttp.StatusOK, map[string]string{
		"status":  "ok",
		"service": "clinicpulse-api",
	})
}
