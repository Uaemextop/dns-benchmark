package main

import (
	"bufio"
	"log"
	"os"
	"strings"

	"github.com/oschwald/geoip2-golang"
)

// AloneFunc_GenSampleServersIPCode is a standalone function with a single purpose, unrelated to the main program.
//
// AloneFunc_GenSampleServersIPCode(GeoDB, "./res/providers.txt", "./res/providers.dat")
//
// Converts a plain text DNS server list to server,IP,code data format. txt -> dat
//
// However, dat is not very suitable for use because it contains DNS resolution results
// based on a specific location and ISP.
//
// Results may change over time.
//
// Input: GeoIP database, raw file path, output file path
func AloneFunc_GenSampleServersIPCode(geoDB *geoip2.Reader, rawFilePath, outFilePath string) {
	// Open input file
	inputFile, err := os.Open(rawFilePath)
	if err != nil {
		log.Fatalf("Cannot open input file: %v", err)
	}
	defer inputFile.Close()

	// Create output file
	outputFile, err := os.Create(outFilePath)
	if err != nil {
		log.Fatalf("Cannot create output file: %v", err)
	}
	defer outputFile.Close()

	// Create a scanner to read the input file
	scanner := bufio.NewScanner(inputFile)
	// Create a writer to write to the output file
	writer := bufio.NewWriter(outputFile)

	// Read input file line by line and write to output file
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		ip, code, err := CheckGeo(geoDB, line, true)
		_, err = writer.WriteString(line + "," + ip + "," + code + ";")
		if err != nil {
			log.Fatalf("Error writing to output file: %v", err)
		}
	}

	// Check for errors during scanning
	if err := scanner.Err(); err != nil {
		log.Fatalf("Error reading input file: %v", err)
	}

	// Flush the writer to ensure all data is written to the file
	writer.Flush()
}
