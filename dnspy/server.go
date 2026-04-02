package main

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
	"github.com/skratchdot/open-golang/open"
)

// benchmarkState represents the current state of a benchmark run.
type benchmarkState int

const (
	stateIdle      benchmarkState = iota
	stateRunning
	stateCompleted
)

// sseEvent is a JSON-serializable event sent to SSE clients.
type sseEvent struct {
	Type      string          `json:"type"`
	Server    string          `json:"server,omitempty"`
	Completed int             `json:"completed,omitempty"`
	Total     int             `json:"total,omitempty"`
	Result    *jsonResult     `json:"result,omitempty"`
	Results   BenchmarkResult `json:"results,omitempty"`
	Message   string          `json:"message,omitempty"`
}

// benchmarkRequest is the JSON body for starting a benchmark.
type benchmarkRequest struct {
	Servers     []string `json:"servers"`
	UseBuiltin  bool     `json:"useBuiltin"`
	Duration    int      `json:"duration"`
	Concurrency int      `json:"concurrency"`
	Workers     int      `json:"workers"`
	NoAAAA      bool     `json:"noAAAA"`
}

// applyDefaults normalises a benchmarkRequest, filling in zero/negative values
// with sensible defaults.
func (req *benchmarkRequest) applyDefaults() {
	if req.Duration < 0 {
		req.Duration = 0
	}
	if req.Duration == 0 {
		// "Unlimited" mode: use a very large duration that will effectively run
		// until stopped. 24 hours is long enough for any practical test.
		req.Duration = 86400
	}
	if req.Concurrency <= 0 {
		req.Concurrency = 10
	}
	if req.Workers <= 0 {
		req.Workers = 20
	}
}

// resolveServers determines the final server list for a benchmark run by
// combining user-provided servers with the built-in list (when requested).
func (s *GuiServer) resolveServers(req benchmarkRequest) ([]string, error) {
	var servers []string
	if len(req.Servers) > 0 {
		servers = req.Servers
	}
	if req.UseBuiltin || len(servers) == 0 {
		serversData, err := GetSampleServersData()
		if err != nil {
			return nil, fmt.Errorf("cannot load built-in server list: %w", err)
		}
		builtinServers, err := FormatListData(&serversData)
		if err != nil {
			return nil, fmt.Errorf("cannot parse built-in server list: %w", err)
		}
		if len(req.Servers) > 0 {
			// Merge: user-specified plus built-in (deduplicate).
			seen := make(map[string]struct{}, len(servers))
			for _, sv := range servers {
				seen[sv] = struct{}{}
			}
			for _, sv := range builtinServers {
				if _, ok := seen[sv]; !ok {
					servers = append(servers, sv)
				}
			}
		} else {
			servers = builtinServers
		}
	}
	return servers, nil
}

// GuiServer manages the HTTP server, benchmark state, and SSE clients.
type GuiServer struct {
	port int

	mu        sync.RWMutex
	state     benchmarkState
	results   BenchmarkResult
	completed int
	total     int
	cancelFn  context.CancelFunc

	sseClientsMu sync.Mutex
	sseClients   map[chan sseEvent]struct{}

	historyMu sync.RWMutex
	history   []benchmarkHistoryEntry
}

// benchmarkHistoryEntry stores metadata about a completed benchmark run.
type benchmarkHistoryEntry struct {
	ID        string          `json:"id"`
	StartedAt string          `json:"startedAt"`
	Servers   int             `json:"servers"`
	Duration  int             `json:"duration"`
	Results   BenchmarkResult `json:"results"`
}

// NewGuiServer creates a new GuiServer on the given port.
func NewGuiServer(port int) *GuiServer {
	return &GuiServer{
		port:       port,
		state:      stateIdle,
		results:    make(BenchmarkResult),
		sseClients: make(map[chan sseEvent]struct{}),
	}
}

// addSSEClient registers a new SSE client channel.
func (s *GuiServer) addSSEClient(ch chan sseEvent) {
	s.sseClientsMu.Lock()
	s.sseClients[ch] = struct{}{}
	s.sseClientsMu.Unlock()
}

// removeSSEClient unregisters an SSE client channel.
func (s *GuiServer) removeSSEClient(ch chan sseEvent) {
	s.sseClientsMu.Lock()
	delete(s.sseClients, ch)
	s.sseClientsMu.Unlock()
}

// broadcast sends an event to all connected SSE clients.
func (s *GuiServer) broadcast(evt sseEvent) {
	s.sseClientsMu.Lock()
	defer s.sseClientsMu.Unlock()
	for ch := range s.sseClients {
		select {
		case ch <- evt:
		default:
			// Drop event if client channel is full.
		}
	}
}

// setCORS adds CORS headers for development convenience.
// Deprecated: use corsMiddleware instead. Kept temporarily for any direct callers.
func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// initResources initialises GeoDB, TempDir, DomainsBinPath, and DnspyreBinPath
// if they have not already been set up. This mirrors the initialisation logic
// in main.go so that the GUI server can operate independently.
func (s *GuiServer) initResources() error {
	var err error

	if GeoDB == nil {
		GeoDB, err = InitGeoDB()
		if err != nil {
			return fmt.Errorf("cannot open GeoIP database: %w", err)
		}
	}

	if TempDir == "" {
		TempDir, err = os.MkdirTemp("", "dnspy-gui")
		if err != nil {
			return fmt.Errorf("cannot create temporary directory: %w", err)
		}
	}

	if DomainsBinPath == "" {
		domainsData, err := GetDomainsData()
		if err != nil {
			return fmt.Errorf("cannot get domain data: %w", err)
		}
		DomainsBinPath = filepath.Join(TempDir, "domains")
		if err := os.WriteFile(DomainsBinPath, domainsData, 0644); err != nil {
			return fmt.Errorf("cannot export domain data: %w", err)
		}
	}

	if DnspyreBinPath == "" {
		dnspyreBinData, filename := GetDnspyreBin()
		DnspyreBinPath = filepath.Join(TempDir, filename)
		if err := os.WriteFile(DnspyreBinPath, dnspyreBinData, 0755); err != nil {
			return fmt.Errorf("cannot write dnspyre binary: %w", err)
		}
	}

	return nil
}

// handleServers returns the list of available DNS servers.
func (s *GuiServer) handleServers(w http.ResponseWriter, r *http.Request) {
	serversData, err := GetSampleServersData()
	if err != nil {
		jsonError(w, "cannot load server list", http.StatusInternalServerError)
		return
	}
	servers, err := FormatListData(&serversData)
	if err != nil {
		jsonError(w, "cannot parse server list", http.StatusInternalServerError)
		return
	}

	jsonOK(w, servers)
}

// handleBenchmarkStart starts a new benchmark run.
func (s *GuiServer) handleBenchmarkStart(w http.ResponseWriter, r *http.Request) {
	if !requirePOST(w, r) {
		return
	}

	s.mu.Lock()
	if s.state == stateRunning {
		s.mu.Unlock()
		jsonError(w, "benchmark already running", http.StatusConflict)
		return
	}

	var req benchmarkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.mu.Unlock()
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Apply defaults.
	req.applyDefaults()

	// Determine the server list.
	servers, err := s.resolveServers(req)
	if err != nil {
		s.mu.Unlock()
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(servers) == 0 {
		s.mu.Unlock()
		jsonError(w, "no servers to test", http.StatusBadRequest)
		return
	}

	// Ensure resources are ready.
	if err := s.initResources(); err != nil {
		s.mu.Unlock()
		log.WithError(err).Error("Failed to initialise resources")
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	s.cancelFn = cancel
	s.state = stateRunning
	s.results = make(BenchmarkResult, len(servers))
	s.completed = 0
	s.total = len(servers)
	s.mu.Unlock()

	log.WithField("servers", len(servers)).Info("GUI benchmark started")

	go s.runBenchmark(ctx, servers, req)

	jsonOK(w, map[string]interface{}{
		"status": "started",
		"total":  len(servers),
	})
}

// runBenchmark executes the benchmark using the same semaphore/worker pattern as main.go.
func (s *GuiServer) runBenchmark(ctx context.Context, servers []string, req benchmarkRequest) {
	randomNum := Round(rand.New(rand.NewSource(time.Now().UnixNano())).Float64(), 2)

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, req.Workers)

	for _, server := range servers {
		// Check for cancellation before launching the next worker.
		select {
		case <-ctx.Done():
			log.Info("GUI benchmark cancelled — stop handler manages state")
			return
		default:
		}

		wg.Add(1)
		semaphore <- struct{}{}

		go func(srv string) {
			defer wg.Done()
			defer func() { <-semaphore }()

			// Check cancellation inside goroutine as well.
			select {
			case <-ctx.Done():
				return
			default:
			}

			output := runDnspyreCtx(ctx, GeoDB, Cfg.PreferIPv4, req.NoAAAA,
				DnspyreBinPath, srv, DomainsBinPath, req.Duration, req.Concurrency, randomNum)

			// If cancelled, skip result recording.
			if ctx.Err() != nil {
				return
			}

			s.mu.Lock()
			s.results[srv] = output
			s.completed++
			completed := s.completed
			total := s.total
			s.mu.Unlock()

			s.broadcast(sseEvent{
				Type:      "progress",
				Server:    srv,
				Completed: completed,
				Total:     total,
				Result:    &output,
			})
		}(server)
	}

	wg.Wait()

	// If cancelled, the stop handler already updated state.
	if ctx.Err() != nil {
		return
	}

	s.mu.Lock()
	s.state = stateCompleted
	s.cancelFn = nil
	results := make(BenchmarkResult, len(s.results))
	for k, v := range s.results {
		results[k] = v
	}
	s.mu.Unlock()

	// Save to history.
	entry := benchmarkHistoryEntry{
		ID:        fmt.Sprintf("%d", time.Now().UnixMilli()),
		StartedAt: time.Now().Format(time.RFC3339),
		Servers:   len(results),
		Duration:  req.Duration,
		Results:   results,
	}
	s.historyMu.Lock()
	s.history = append(s.history, entry)
	s.historyMu.Unlock()

	log.Info("GUI benchmark complete")
	s.broadcast(sseEvent{
		Type:    "complete",
		Results: results,
	})
}

// handleBenchmarkStatus is the SSE endpoint for streaming progress events.
func (s *GuiServer) handleBenchmarkStatus(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		jsonError(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := make(chan sseEvent, 64)
	s.addSSEClient(ch)
	defer s.removeSSEClient(ch)

	// Send an initial status snapshot so newly connected clients know the state.
	s.mu.RLock()
	state := s.state
	completed := s.completed
	total := s.total
	s.mu.RUnlock()

	initEvt := sseEvent{
		Type:      "status",
		Completed: completed,
		Total:     total,
	}
	switch state {
	case stateRunning:
		initEvt.Message = "running"
	case stateCompleted:
		initEvt.Message = "completed"
	default:
		initEvt.Message = "idle"
	}

	data, _ := json.Marshal(initEvt)
	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()

	// Stream events until the client disconnects.
	for {
		select {
		case <-r.Context().Done():
			return
		case evt := <-ch:
			data, err := json.Marshal(evt)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// handleBenchmarkStop cancels a running benchmark and saves partial results.
func (s *GuiServer) handleBenchmarkStop(w http.ResponseWriter, r *http.Request) {
	if !requirePOST(w, r) {
		return
	}

	s.mu.Lock()
	if s.state != stateRunning || s.cancelFn == nil {
		s.mu.Unlock()
		jsonError(w, "no benchmark running", http.StatusConflict)
		return
	}
	cancel := s.cancelFn
	s.state = stateCompleted
	s.cancelFn = nil

	// Snapshot partial results collected so far.
	partialResults := make(BenchmarkResult, len(s.results))
	for k, v := range s.results {
		partialResults[k] = v
	}
	s.mu.Unlock()

	// Cancel context — kills running dnspyre subprocesses immediately.
	cancel()

	// Save partial results to history so they are not lost.
	if len(partialResults) > 0 {
		entry := benchmarkHistoryEntry{
			ID:        fmt.Sprintf("%d", time.Now().UnixMilli()),
			StartedAt: time.Now().Format(time.RFC3339),
			Servers:   len(partialResults),
			Duration:  0,
			Results:   partialResults,
		}
		s.historyMu.Lock()
		s.history = append(s.history, entry)
		s.historyMu.Unlock()
	}

	log.WithField("results", len(partialResults)).Info("GUI benchmark stopped — partial results saved")
	s.broadcast(sseEvent{Type: "stopped", Results: partialResults, Message: "benchmark stopped"})

	jsonOK(w, map[string]interface{}{
		"status":  "stopped",
		"results": len(partialResults),
	})
}

// handleBenchmarkResults returns the latest benchmark results.
func (s *GuiServer) handleBenchmarkResults(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	results := make(BenchmarkResult, len(s.results))
	for k, v := range s.results {
		results[k] = v
	}
	s.mu.RUnlock()

	jsonOK(w, results)
}

// handleBenchmarkHistory returns the list of past benchmark runs.
func (s *GuiServer) handleBenchmarkHistory(w http.ResponseWriter, r *http.Request) {
	s.historyMu.RLock()
	hist := make([]benchmarkHistoryEntry, len(s.history))
	copy(hist, s.history)
	s.historyMu.RUnlock()

	jsonOK(w, hist)
}

// StartGUI initialises the GUI server, opens the browser, and starts serving.
func StartGUI(port int) {
	srv := NewGuiServer(port)

	mux := http.NewServeMux()

	// Serve web UI (embedded in release, from disk in debug).
	webFS, err := GetWebUIFS()
	if err != nil {
		log.WithError(err).Fatal("Cannot load web UI data")
	}
	fileServer := http.FileServer(http.FS(webFS))
	mux.Handle("/", fileServer)

	// API routes.
	mux.HandleFunc("/api/servers", srv.handleServers)
	mux.HandleFunc("/api/benchmark/start", srv.handleBenchmarkStart)
	mux.HandleFunc("/api/benchmark/status", srv.handleBenchmarkStatus)
	mux.HandleFunc("/api/benchmark/stop", srv.handleBenchmarkStop)
	mux.HandleFunc("/api/benchmark/results", srv.handleBenchmarkResults)
	mux.HandleFunc("/api/benchmark/history", srv.handleBenchmarkHistory)

	// Wrap all routes with CORS middleware.
	handler := corsMiddleware(mux)

	addr := fmt.Sprintf(":%d", port)
	url := fmt.Sprintf("http://localhost:%d", port)

	log.Infof("Starting GUI server at %s", url)
	fmt.Printf("\n  DNS Benchmark GUI: %s\n\n", url)

	// Open browser in a separate goroutine so the server starts immediately.
	go func() {
		time.Sleep(500 * time.Millisecond)
		if err := open.Run(url); err != nil {
			log.WithError(err).Warn("Cannot open browser automatically")
			fmt.Printf("  Please open %s in your browser.\n\n", url)
		}
	}()

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
	}

	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.WithError(err).Fatal("GUI server error")
	}
}

// GetWebUIFS is defined in gui_data_release.go (embed) and gui_data_debug.go (filesystem).
// It returns an fs.FS rooted at the web/dist directory.
