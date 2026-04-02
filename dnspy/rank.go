package main

import (
	"math"
)

type scoreResult struct {
	Total       float64 `json:"total"`
	SuccessRate float64 `json:"successRate"`
	ErrorRate   float64 `json:"errorRate"`
	Latency     float64 `json:"latency"`
	Qps         float64 `json:"qps"`
}

// Weight constants for different scoring categories
const (
	SuccessRateScoreWeight = 35
	ErrorRateScoreWeight   = 10
	LatencyScoreWeight     = 50
	QpsScoreWeight         = 5
)

// Threshold constants for score calculation
const (
	LatencyRangeMax      = 1000 // Average latency above *ms scores 0
	LatencyRangeMin      = 0.1  // Average latency below *ms scores 0
	LatencyFullMarkPoint = 50   // Average latency below *ms gets full marks
	MaxQps               = 100  // * QPS for full marks
)

// Error value definitions
var ErrNoRequests = scoreResult{}

// ScoreBenchmarkResult calculates the score for a DNS server
func ScoreBenchmarkResult(r jsonResult) scoreResult {
	// Check if successful responses count is 0
	if r.TotalSuccessResponses == 0 {
		return ErrNoRequests
	}

	// Calculate success rate: ratio of successful responses to total requests
	successRate := float64(r.TotalSuccessResponses) / float64(r.TotalRequests)
	// Success rate score: linear mapping
	successRateScore := successRate * 100

	// Calculate error rate: ratio of error responses and IO errors to total requests
	errorRate := float64(r.TotalErrorResponses+r.TotalIOErrors) / float64(r.TotalRequests)
	// Error rate score calculation: linear mapping
	errorRateScore := 100 * (1 - errorRate)
	// Ensure final score is between 0-100
	errorRateScore = math.Max(0, math.Min(100, errorRateScore))

	// Calculate latency score: combining average latency and standard deviation for stability
	var latencyScore float64
	// Combine mean and median
	meanMS := float64((r.LatencyStats.MeanMs + r.LatencyStats.P50Ms) / 2)

	if meanMS < LatencyRangeMin || meanMS > LatencyRangeMax {
		// Invalid average latency, score is 0
		latencyScore = 0
	} else {
		// If average latency is between full mark threshold and 0.1ms, calculate linearly
		baseScore := 100 - (meanMS-LatencyFullMarkPoint)*100/(LatencyRangeMax-LatencyFullMarkPoint)
		// Consider standard deviation, apply a light penalty factor for high latency variance
		stabilityFactor := 1 / (1 + 0.5*math.Pow(float64(r.LatencyStats.StdMs)/meanMS, 2))
		latencyScore = baseScore * (0.8 + 0.2*stabilityFactor)
	}
	// Ensure final score is between 0-100
	latencyScore = math.Max(0, math.Min(100, latencyScore))

	// If p95 latency is also very high, further reduce the score (handle extreme latency cases)
	if r.LatencyStats.P95Ms > LatencyRangeMax {
		latencyScore *= 0.85 // Unstable latency, additional penalty
	}

	// QPS score: logarithmic mapping, considering max QPS
	qpsScore := 100 * math.Log(1+r.QueriesPerSecond) / math.Log(1+MaxQps)
	// Ensure score does not exceed 100
	qpsScore = math.Min(100, qpsScore)

	// Composite total score: weighted calculation based on each category
	totalScore := (successRateScore*SuccessRateScoreWeight +
		errorRateScore*ErrorRateScoreWeight +
		latencyScore*LatencyScoreWeight +
		qpsScore*QpsScoreWeight) / 100

	// Return score result
	return scoreResult{
		Total:       Round(totalScore, 2),
		SuccessRate: Round(successRateScore, 2),
		ErrorRate:   Round(errorRateScore, 2),
		Latency:     Round(latencyScore, 2),
		Qps:         Round(qpsScore, 2),
	}
}
