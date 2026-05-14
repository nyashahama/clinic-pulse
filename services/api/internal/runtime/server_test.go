package runtime

import (
	"net/http"
	"testing"
	"time"
)

func TestNewServerAppliesTimeouts(t *testing.T) {
	handler := http.NewServeMux()
	cfg := ServerConfig{
		Addr:            ":9999",
		ReadTimeout:     3 * time.Second,
		WriteTimeout:    4 * time.Second,
		IdleTimeout:     5 * time.Second,
		ShutdownTimeout: 6 * time.Second,
	}

	server := NewServer(cfg, handler)

	if server.Addr != cfg.Addr {
		t.Fatalf("Addr = %q, want %q", server.Addr, cfg.Addr)
	}
	if server.Handler != handler {
		t.Fatalf("Handler = %p, want %p", server.Handler, handler)
	}
	if server.ReadTimeout != cfg.ReadTimeout {
		t.Fatalf("ReadTimeout = %s, want %s", server.ReadTimeout, cfg.ReadTimeout)
	}
	if server.WriteTimeout != cfg.WriteTimeout {
		t.Fatalf("WriteTimeout = %s, want %s", server.WriteTimeout, cfg.WriteTimeout)
	}
	if server.IdleTimeout != cfg.IdleTimeout {
		t.Fatalf("IdleTimeout = %s, want %s", server.IdleTimeout, cfg.IdleTimeout)
	}
}
