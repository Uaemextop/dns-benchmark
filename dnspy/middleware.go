package main

import (
	"encoding/json"
	"net/http"
)

// ──────────────────────────────────────────────────────────────────────────────
// CORS Middleware
// ──────────────────────────────────────────────────────────────────────────────

// corsMiddleware wraps an http.Handler and sets CORS headers for every response.
// It also handles pre-flight OPTIONS requests automatically.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ──────────────────────────────────────────────────────────────────────────────
// JSON Response Helpers
// ──────────────────────────────────────────────────────────────────────────────

// jsonError writes a JSON error response with the given status code.
func jsonError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// jsonOK writes a JSON success response (200 OK).
func jsonOK(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// ──────────────────────────────────────────────────────────────────────────────
// Method Enforcement
// ──────────────────────────────────────────────────────────────────────────────

// requirePOST returns true if the request is POST. Otherwise it writes an
// appropriate error response and returns false.
func requirePOST(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != http.MethodPost {
		jsonError(w, "method not allowed", http.StatusMethodNotAllowed)
		return false
	}
	return true
}
