package http

import (
	"encoding/json"
	nethttp "net/http"
)

type errorResponse struct {
	Error responseError `json:"error"`
}

type responseError struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Fields  []string `json:"fields,omitempty"`
}

func RespondJSON(w nethttp.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func RespondError(w nethttp.ResponseWriter, status int, code string, message string, fields ...string) {
	RespondJSON(w, status, errorResponse{
		Error: responseError{
			Code:    code,
			Message: message,
			Fields:  fields,
		},
	})
}
