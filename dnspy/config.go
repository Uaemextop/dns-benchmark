package main

import (
	"fmt"
	"os"
	"strings"

	log "github.com/sirupsen/logrus"
	flag "github.com/spf13/pflag"
)

// Config stores all configuration options
type Config struct {
	LogJSON         bool     // Log format (JSON)
	LogLevel        string   // Log level
	PreferIPv4      bool     // Prefer IPv4 addresses when resolving DNS server hostnames to IP addresses
	ServersDataPath string   // Path to server data file (relative to working directory, one entry per line)
	DomainsDataPath string   // Path to domain data file for bulk testing (relative to working directory, one entry per line)
	Duration        int      // Duration of each test in seconds
	Concurrency     int      // Concurrency count for each test
	NoAAAARecord    bool     // Do not resolve AAAA records in each test
	Servers         []string // Manually specified servers to test (supports multiple)
	Workers         int      // Number of DNS servers to test simultaneously
	OutputPath      string   // Output result file path (relative to working directory)
	OldIsToHTML     bool     // Use legacy method to output data to a single HTML file
	// Feature flags
	InputResultJsonPath string // Input result JSON file path (relative to working directory)
	FnGeo               string // Use GeoIP database for IP geolocation queries
}

func InitFlags() (Config, error) {
	cfg := Config{}
	flag.BoolVar(&cfg.LogJSON, "json", false, "\x1b[32mOutput logs in JSON format\x1b[0m\n")
	flag.StringVarP(&cfg.LogLevel, "level", "l", "info", "\x1b[32mLog level\nOptions: debug, info, warn, error, fatal, panic\x1b[0m\n")
	flag.BoolVar(&cfg.PreferIPv4, "prefer-ipv4", true, "\x1b[32mPrefer IPv4 addresses when resolving DNS server hostnames to IP addresses\x1b[0m\n")
	flag.StringVarP(&cfg.ServersDataPath, "file", "f", "", "\x1b[32mFile path for server data to bulk test\nMust be relative to the current working directory\nOne server address per line\x1b[0m\n")
	flag.StringSliceVarP(&cfg.Servers, "server", "s", []string{}, "\x1b[32mManually specify servers to test (supports multiple)\x1b[0m\n")
	flag.StringVarP(&cfg.DomainsDataPath, "domains", "d", "@sampleDomains@", "\x1b[32mFile path for domain data to bulk test\nMust be relative to the current working directory\nOne domain per line\nUses built-in 10000 popular domains if not specified\x1b[0m\n")
	flag.IntVarP(&cfg.Duration, "duration", "t", 10, "\x1b[32mDuration of each test in seconds\x1b[0m\n")
	flag.IntVarP(&cfg.Concurrency, "concurrency", "c", 10, "\x1b[32mConcurrency count for each test\x1b[0m\n")
	flag.IntVarP(&cfg.Workers, "worker", "w", 20, "\x1b[32mNumber of DNS servers to test simultaneously\x1b[0m\n")
	flag.BoolVar(&cfg.NoAAAARecord, "no-aaaa", false, "\x1b[32mDo not resolve AAAA records in each test (skip IPv6 testing)\x1b[0m\n")
	flag.StringVarP(&cfg.OutputPath, "output", "o", "", "\x1b[32mOutput result file path\nMust be relative to the current working directory\nIf not specified, outputs to dnspy_result_<current_time>.json in the current directory\x1b[0m\n")
	flag.BoolVar(&cfg.OldIsToHTML, "old-html", false, "\x1b[32mDeprecated, not recommended\nRecommended: Program outputs a JSON file, follow prompts to view visual analysis\nTo view again later, open the JSON file directly with the program\nThis parameter uses the legacy method to output a single HTML file alongside the JSON data\nCan be opened by double-clicking\x1b[0m\n")
	flag.StringVarP(&cfg.FnGeo, "geo", "g", "", "\x1b[32mStandalone feature: Query IP or domain geolocation using GeoIP database\x1b[0m\n")
	// Usage instructions
	flag.Usage = func() {
		fmt.Print("Usage examples:\n\n" +
			"\x1b[33mdnspy\x1b[0m\n\n" +
			"\x1b[32mStart testing directly using built-in worldwide DNS servers\x1b[0m\n\n" +
			"\x1b[33mdnspy -s 114.114.114.114\x1b[0m\n\n" +
			"\x1b[32mTest a single server\x1b[0m\n\n" +
			"\x1b[33mdnspy dnspy_benchmark_2024-10-22-08-18.json\x1b[0m\n\n" +
			"\x1b[32mVisualize and analyze test results\x1b[0m\n\n" +
			"Parameters:\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	otherFlags := flag.Args()
	exitTrigger := false

	if cfg.FnGeo != "" {
		exitTrigger = true
		geoDB, err := InitGeoDB()
		if err != nil {
			log.WithFields(log.Fields{
				"error": err,
			}).Error("Failed to read GeoIP database")
			return cfg, err
		}
		ip, country, err := CheckGeo(geoDB, cfg.FnGeo, cfg.PreferIPv4)
		if err != nil {
			log.WithFields(log.Fields{
				"error": err,
			}).Error("Query failed")
			return cfg, err
		}
		log.WithFields(log.Fields{
			"IP":   ip,
			"Code": country,
		}).Infof("\x1b[32mQuery result:\x1b[0m")
	}

	for _, v := range otherFlags {
		if strings.HasSuffix(v, ".json") {
			cfg.InputResultJsonPath = v
			if cfg.OldIsToHTML {
				jsonData, err := os.ReadFile(cfg.InputResultJsonPath)
				if err != nil {
					log.WithFields(log.Fields{
						"error":      err,
						"input_file": cfg.InputResultJsonPath,
					}).Error("Failed to read input JSON file")
					return cfg, err
				}
				OutputHTML(cfg.InputResultJsonPath, string(jsonData))
				exitTrigger = true
			}
		}
	}

	if exitTrigger {
		os.Exit(0)
	}

	if cfg.ServersDataPath == "" && len(cfg.Servers) == 0 {
		log.Error("You have not specified a server data file path or manually entered servers to test")
		log.Info("Would you like to use the built-in worldwide DNS server data to start testing (many servers, testing will take some time)? [y/N]")
		var input string
		fmt.Scanln(&input)
		if input == "Y" || input == "y" {
			cfg.ServersDataPath = "@sampleServers@"
		} else {
			// log.Error("No valid data, program exit")
			return cfg, fmt.Errorf("no valid data")
		}
	}

	return cfg, nil
}
