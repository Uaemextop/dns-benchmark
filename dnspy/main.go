package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"math/rand"

	"github.com/oschwald/geoip2-golang"
	log "github.com/sirupsen/logrus"
	"github.com/skratchdot/open-golang/open"
)

const TemplateHTMLPlaceholder = "__JSON_DATA_PLACEHOLDER__"

// Global variables
var (
	Cfg            Config
	GeoDB          *geoip2.Reader
	WorkDir        string
	TempDir        string
	DomainsBinPath string
	DnspyreBinPath string
	Servers        []string
	OutputPath     string
	OutputFile     *os.File
	RetData        BenchmarkResult
)

func main() {
	var err error
	nowTime := time.Now()
	InitLog(false, "info")

	// Initialize configuration
	if Cfg, err = InitFlags(); err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mNo valid data, program exit\x1b[0m")
	}
	Servers = Cfg.Servers

	InitLog(Cfg.LogJSON, Cfg.LogLevel)

	// GUI mode: start the web server instead of running CLI benchmark
	if Cfg.GUI {
		StartGUI(Cfg.GUIPort)
		return
	}

	// Initialize output file
	OutputPath = Cfg.OutputPath
	if OutputPath == "" {
		OutputPath = fmt.Sprintf("dnspy_result_%s.json", nowTime.Local().Format("2006-01-02-15-04-05"))
	} else if filepath.Ext(OutputPath) != ".json" {
		OutputPath += ".json"
	}

	OutputFile, err = os.Create(OutputPath)
	if err != nil {
		log.WithFields(log.Fields{
			"error":       err,
			"output_file": OutputPath,
		}).Fatal("\x1b[31mCannot create output file\x1b[0m")
	}
	defer OutputFile.Close()

	log.WithFields(log.Fields{
		"output_file": OutputPath,
	}).Infof("\x1b[32mResults will be written to file\x1b[0m")

	// Initialize GeoIP database
	GeoDB, err = InitGeoDB()
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mCannot open GeoIP database\x1b[0m")
	}
	defer GeoDB.Close()

	// Main function flow
	WorkDir, err = os.Getwd()
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mCannot get current working directory\x1b[0m")
	}

	// Create a temporary directory
	TempDir, err = os.MkdirTemp("", "dnspy")
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mCannot create temporary directory\x1b[0m")
	}
	defer os.RemoveAll(TempDir)
	// log.Infof("Temporary directory: %s", TempDir)

	// Configure domain data
	if Cfg.DomainsDataPath == "@sampleDomains@" {
		domainsData, _ := GetDomainsData()
		DomainsBinPath = filepath.Join(TempDir, "domains")
		err := os.WriteFile(DomainsBinPath, domainsData, 0644)
		if err != nil {
			log.WithFields(log.Fields{
				"error": err,
			}).Fatal("\x1b[31mCannot export domain data\x1b[0m")
		}
	} else {
		// Get DomainsDataPath relative to WorkDir
		DomainsBinPath = filepath.Join(WorkDir, Cfg.DomainsDataPath)
		if _, err := os.Stat(DomainsBinPath); os.IsNotExist(err) {
			log.WithFields(log.Fields{
				"error": err,
			}).Fatal("\x1b[31mInput domain data file does not exist\x1b[0m")
		}
	}

	// log.Info("Domain data path: ", DomainsBinPath)

	// Read server list file
	if Cfg.ServersDataPath == "@sampleServers@" {
		serversData, _ := GetSampleServersData()
		Servers, err = FormatListData(&serversData)
	} else {
		if Cfg.ServersDataPath != "" {
			Servers, err = FormatListFile(Cfg.ServersDataPath)
			if err != nil {
				log.WithFields(log.Fields{
					"error": err,
				}).Fatal("\x1b[31mCannot format server list file\x1b[0m")
			}
		}
	}

	log.Infof("Number of servers to test: %d", len(Servers))

	// Export dnspyre binary
	dnspyreBinData, filename := GetDnspyreBin()
	DnspyreBinPath = filepath.Join(TempDir, filename)
	err = os.WriteFile(DnspyreBinPath, dnspyreBinData, 0755)
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mCannot write dnspyre binary file\x1b[0m")
	}

	serverCount := len(Servers)
	// Check for valid data
	if Cfg.Workers == 0 || serverCount == 0 {
		log.Fatal("\x1b[31mNo valid data, program exit\x1b[0m")
	}

	// Initialize test results
	RetData = make(map[string]jsonResult, serverCount)
	var mu sync.Mutex // Mutex lock

	// Generate a random decimal between 0 and 1, rounded to two decimal places
	randomGenerator := rand.New(rand.NewSource(nowTime.UnixNano()))
	randomNum := Round(randomGenerator.Float64(), 2)

	// Single-threaded testing
	if Cfg.Workers == 1 {
		for _, server := range Servers {
			output := runDnspyre(GeoDB, Cfg.PreferIPv4, Cfg.NoAAAARecord, DnspyreBinPath, server, DomainsBinPath, Cfg.Duration, Cfg.Concurrency, randomNum)
			RetData[server] = output
		}
	} else {
		// Multi-threaded testing, use Cfg.Workers to control max concurrent threads
		var wg sync.WaitGroup
		semaphore := make(chan struct{}, Cfg.Workers)

		for _, server := range Servers {
			wg.Add(1)
			semaphore <- struct{}{}
			go func(srv string) {
				defer wg.Done()
				defer func() { <-semaphore }()
				output := runDnspyre(GeoDB, Cfg.PreferIPv4, Cfg.NoAAAARecord, DnspyreBinPath, srv, DomainsBinPath, Cfg.Duration, Cfg.Concurrency, randomNum)
				mu.Lock() // Lock
				RetData[srv] = output
				mu.Unlock() // Unlock
			}(server)
		}

		wg.Wait()
	}

	log.Info("Testing complete")
	// log.Info("Test results: ", RetData)

	// Convert test results to JSON string
	retDataString, err := RetData.String()
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mCannot convert test results to JSON string\x1b[0m")
	}

	if Cfg.OldIsToHTML {
		OutputHTML(OutputPath, retDataString)
	}

	// Output JSON file
	_, err = OutputFile.WriteString(retDataString)
	if err != nil {
		log.WithFields(log.Fields{
			"error":       err,
			"output_file": OutputPath,
		}).Fatal("\x1b[31mCannot write results to output file\x1b[0m")
	}
	log.WithFields(log.Fields{
		"output_file": OutputPath,
	}).Info("\x1b[32mTest results have been written to file\x1b[0m")

	// Ask whether to open data analysis website
	log.Info("Would you like to open the data analysis dashboard in your default browser? [Y/n]")
	var input string
	fmt.Scanln(&input)
	if input == "Y" || input == "y" || input == "" {
		err := open.Run("https://bench.dash.2020818.xyz")
		if err != nil {
			log.WithError(err).Error("Cannot open data analysis website")
		}
	}
}

func OutputHTML(path string, resultString string) {
	htmlFilePath := path[:len(path)-5] + ".html"
	htmlFile, err := os.Create(htmlFilePath)
	if err != nil {
		log.WithFields(log.Fields{
			"error": err,
		}).Fatal("\x1b[31mCannot create HTML file\x1b[0m")
	}
	defer htmlFile.Close()
	htmlTemplateData, _ := GetTemplateHTML()
	htmlTemplate := strings.Replace(string(htmlTemplateData), TemplateHTMLPlaceholder, resultString, 1)

	_, err = htmlFile.WriteString(htmlTemplate)
	if err != nil {
		log.WithFields(log.Fields{
			"error":       err,
			"output_file": path,
		}).Fatal("\x1b[31mCannot write to output file\x1b[0m")
	}
	log.WithFields(log.Fields{
		"output_file": path,
	}).Info("\x1b[32mTest results have been written to file\x1b[0m")

	log.Info("Would you like to open the HTML output file in your default browser? [Y/n]")
	var input string
	fmt.Scanln(&input)
	if input == "Y" || input == "y" || input == "" {
		err := open.Run(htmlFilePath)
		if err != nil {
			log.WithError(err).Error("Cannot open output file")
		}
	}
}
