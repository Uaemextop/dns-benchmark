package main

import (
	"os"
	"testing"
)

func TestFormatListFile(t *testing.T) {
	// Create temporary test file
	tempFile, err := os.CreateTemp("", "test_list_*.txt")
	if err != nil {
		t.Fatalf("Failed to create temporary file: %v", err)
	}
	defer os.Remove(tempFile.Name())

	// Write test data
	testData := []byte("line1\n  line2  \n# comment\n\nline3")
	if _, err := tempFile.Write(testData); err != nil {
		t.Fatalf("Failed to write test data: %v", err)
	}
	tempFile.Close()

	// Test FormatListFile function
	result, err := FormatListFile(tempFile.Name())
	if err != nil {
		t.Fatalf("FormatListFile failed: %v", err)
	}

	expected := []string{"line1", "line2", "line3"}
	if len(result) != len(expected) {
		t.Fatalf("Expected result length %d, got %d", len(expected), len(result))
	}

	for i, v := range expected {
		if result[i] != v {
			t.Errorf("Line %d mismatch, expected %q, got %q", i+1, v, result[i])
		}
	}
}

func TestFormatListData(t *testing.T) {
	testData := []byte("line1\n  line2  \n# comment\n\nline3")
	result, err := FormatListData(&testData)
	if err != nil {
		t.Fatalf("FormatListData failed: %v", err)
	}

	expected := []string{"line1", "line2", "line3"}
	if len(result) != len(expected) {
		t.Fatalf("Expected result length %d, got %d", len(expected), len(result))
	}

	for i, v := range expected {
		if result[i] != v {
			t.Errorf("Line %d mismatch, expected %q, got %q", i+1, v, result[i])
		}
	}
}
