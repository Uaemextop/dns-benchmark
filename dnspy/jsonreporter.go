package main

import (
	"encoding/json"
)

type latencyStats struct {
	MinMs  int64 `json:"minMs"`
	MeanMs int64 `json:"meanMs"`
	StdMs  int64 `json:"stdMs"`
	MaxMs  int64 `json:"maxMs"`
	P99Ms  int64 `json:"p99Ms"`
	P95Ms  int64 `json:"p95Ms"`
	P90Ms  int64 `json:"p90Ms"`
	P75Ms  int64 `json:"p75Ms"`
	P50Ms  int64 `json:"p50Ms"`
}

type jsonResult struct {
	// dnspyre JSON output field definitions used by this tool
	TotalRequests            int64            `json:"totalRequests"`
	TotalSuccessResponses    int64            `json:"totalSuccessResponses"`
	TotalNegativeResponses   int64            `json:"totalNegativeResponses"`
	TotalErrorResponses      int64            `json:"totalErrorResponses"`
	TotalIOErrors            int64            `json:"totalIOErrors"`
	TotalIDmismatch          int64            `json:"totalIDmismatch"` // dnspyre v3.4.1
	TotalTruncatedResponses  int64            `json:"totalTruncatedResponses"`
	ResponseRcodes           map[string]int64 `json:"responseRcodes,omitempty"`
	QuestionTypes            map[string]int64 `json:"questionTypes"`
	QueriesPerSecond         float64          `json:"queriesPerSecond"`
	BenchmarkDurationSeconds float64          `json:"benchmarkDurationSeconds"`
	LatencyStats             latencyStats     `json:"latencyStats"`

	// Additional fields: geographic information
	IPAddress string      `json:"ip"`
	Geocode   string      `json:"geocode"`
	Score     scoreResult `json:"score"`
}

// BenchmarkResult is a custom type for JSON serialization
type BenchmarkResult map[string]jsonResult

func (b *BenchmarkResult) String() (string, error) {
	jsonData, err := json.Marshal(b)
	if err != nil {
		return "", err
	}
	// return template.JSEscapeString(string(jsonData)), nil
	return string(jsonData), nil
}
