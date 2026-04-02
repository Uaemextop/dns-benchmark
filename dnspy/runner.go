package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"

	"github.com/oschwald/geoip2-golang"
	log "github.com/sirupsen/logrus"
)

// Core test implementation
func runDnspyre(geoDB *geoip2.Reader, preferIPv4 bool, noAAAA bool, binPath, server, domainsPath string, duration, concurrency int, probability float64) jsonResult {
	return runDnspyreCtx(context.Background(), geoDB, preferIPv4, noAAAA, binPath, server, domainsPath, duration, concurrency, probability)
}

// runDnspyreCtx is like runDnspyre but accepts a context for cancellation.
func runDnspyreCtx(ctx context.Context, geoDB *geoip2.Reader, preferIPv4 bool, noAAAA bool, binPath, server, domainsPath string, duration, concurrency int, probability float64) jsonResult {

	log.WithFields(log.Fields{
		"target":      server,
		"duration":    fmt.Sprintf("%ds", duration),
		"concurrency": concurrency,
		"probability": fmt.Sprintf("%.2f", probability),
	}).Infof("\x1b[32m%s starting test\x1b[0m", server)

	// Check cancellation early.
	select {
	case <-ctx.Done():
		return jsonResult{}
	default:
	}

	// Get server geographic information first
	ip, geoCode, err := CheckGeo(geoDB, server, preferIPv4)
	if err != nil {
		log.WithFields(log.Fields{
			"target": server,
			"error":  err,
		}).Errorf("\x1b[31m%s resolution failed\x1b[0m", server)
		return jsonResult{}
	} else {
		log.WithFields(log.Fields{
			"target": server,
			"IP":     ip,
			"code":   geoCode,
		}).Infof("\x1b[32m%s resolved successfully\x1b[0m", server)
	}

	// Check cancellation after geo lookup.
	select {
	case <-ctx.Done():
		return jsonResult{}
	default:
	}

	// Run dnspyre
	args := []string{
		"--json",
		"--no-distribution",
		"-t", "A",
		"--duration", fmt.Sprintf("%ds", duration),
		"-c", fmt.Sprintf("%d", concurrency),
		"@" + domainsPath,
		"--probability", fmt.Sprintf("%.2f", probability),
		"--server", server,
	}
	if !noAAAA {
		args = append(args, "-t", "AAAA")
	}

	cmd := exec.CommandContext(ctx, binPath, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	log.WithFields(log.Fields{
		"target": server,
	}).Infof("\x1b[32m%s starting test\x1b[0m", server)
	err = cmd.Run()

	if ctx.Err() != nil {
		// Cancelled — don't log as error.
		return jsonResult{}
	}

	if err != nil {
		log.WithFields(log.Fields{
			"target": server,
			"error":  err,
			"stderr": stderr.String(),
		}).Errorf("\x1b[31m%s test failed\x1b[0m", server)
		return jsonResult{}
	}

	ret := stdout.Bytes()
	retLen := len(ret)
	// Check dnspyre output format
	if retLen == 0 || ret[0] != '{' || !bytes.HasSuffix(ret, []byte("}\n")) {
		log.WithFields(log.Fields{
			"target": server,
			"error":  "dnspyre output format error",
		}).Errorf("\x1b[31m%s test failed\x1b[0m", server)
		return jsonResult{}
	}

	// Convert to JSON format
	var result jsonResult
	err = json.Unmarshal(ret, &result)
	if err != nil {
		log.WithFields(log.Fields{
			"target": server,
			"error":  err,
		}).Errorf("\x1b[31m%s test failed\x1b[0m", server)
		return jsonResult{}
	}

	// Add geographic information
	result.Geocode = geoCode
	result.IPAddress = ip

	// Calculate score
	result.Score = ScoreBenchmarkResult(result)

	if result.Score.Total == 0 {
		log.WithFields(log.Fields{
			"target": server,
			"error":  "cannot connect to server",
		}).Errorf("\x1b[31m%s test failed\x1b[0m", server)
	} else {
		log.WithFields(log.Fields{
			"target":             server,
			"total_score":        fmt.Sprintf("%.2f", result.Score.Total),
			"success_rate_score": fmt.Sprintf("%.2f", result.Score.SuccessRate),
			"error_rate_score":   fmt.Sprintf("%.2f", result.Score.ErrorRate),
			"latency_score":     fmt.Sprintf("%.2f", result.Score.Latency),
			"qps_score":         fmt.Sprintf("%.2f", result.Score.Qps),
		}).Infof("\x1b[32m%s test complete\x1b[0m", server)
	}
	return result
}
