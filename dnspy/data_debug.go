//go:build !release

package main

import (
	"os"

	"github.com/oschwald/geoip2-golang"
)

// geoDataPath is the path to the GeoLite2 City database.
// This constant defines the relative path of the GeoLite2 City database file.
// This database is used for IP geolocation queries to determine the country and
// subdivision (state/region) of an IP address, providing better coverage for
// countries like Mexico and the United States.
const geoDataPath = "./res/GeoLite2-City.mmdb"

// GetGeoData opens and returns a GeoIP2 database reader.
// This function attempts to open the GeoLite2 country database file and returns a reader for querying.
// Returns:
//   - *geoip2.Reader: A GeoIP2 database reader on success
//   - error: An error if opening the file fails
func GetGeoData() (*geoip2.Reader, error) {
	return geoip2.Open(geoDataPath)
}

// sampleServersDataPath is the path to the sample DNS server list.
// This constant defines the relative path of the text file containing the DNS server list.
// This file contains a list of DNS server addresses for DNS performance testing.
const sampleServersDataPath = "./res/providers.txt"

// GetSampleServersData reads and returns the contents of the sample DNS server list.
// This function reads the text file containing the DNS server list and returns its contents.
// Returns:
//   - []byte: The complete file contents on success
//   - error: An error if reading the file fails
func GetSampleServersData() ([]byte, error) {
	return os.ReadFile(sampleServersDataPath)
}

// domainsDataPath is the path to the domain data file.
// This constant defines the relative path of the text file containing domain data.
// This file contains a list of domains for DNS performance testing.
const domainsDataPath = "./res/domains.txt"

// GetDomainsData reads and returns the contents of the domain data file.
// This function reads the text file containing domain data and returns its contents.
func GetDomainsData() ([]byte, error) {
	return os.ReadFile(domainsDataPath)
}

// templateHTMLPath is the path to the HTML template file.
// This constant defines the relative path of the HTML template file.
// This template is used to generate HTML reports of test results.
const templateHTMLPath = "./res/template.html"

// GetTemplateHTML reads and returns the contents of the HTML template file.
// This function reads the HTML template file and returns its contents.
// Returns:
//   - []byte: The complete file contents on success
//   - error: An error if reading the file fails
func GetTemplateHTML() ([]byte, error) {
	return os.ReadFile(templateHTMLPath)
}
