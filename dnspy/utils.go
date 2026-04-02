package main

import (
	"bufio"
	"bytes"
	"fmt"
	"math"
	"os"
	"strings"
)

// FormatListFile formats a list file
func FormatListFile(path string) ([]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}
	return FormatListData(&data)
}

// FormatListData formats list data bytes
func FormatListData(data *[]byte) ([]string, error) {
	lines := make([]string, 0, 100) // Pre-allocate capacity to reduce memory allocation
	scanner := bufio.NewScanner(bytes.NewReader(*data))
	scanner.Buffer(make([]byte, 4096), 1048576) // Set larger buffer

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" && !strings.HasPrefix(line, "#") {
			lines = append(lines, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to scan data: %w", err)
	}

	return lines, nil
}

// Round rounds a float to the specified number of decimal places
func Round(x float64, precision int) float64 {
	scale := math.Pow10(precision)
	return math.Round(x*scale) / scale
}
