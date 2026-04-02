//go:build release

package main

import (
	_ "embed"

	"github.com/oschwald/geoip2-golang"
)

//go:embed res/Country.mmdb
var GeoData []byte

// GetGeoData returns a GeoIP2 database reader for IP geolocation queries.
// This function uses the embedded GeoData byte slice to create a geoip2.Reader instance.
// Returns:
//   - *geoip2.Reader: A GeoIP2 database reader on success
//   - error: An error if creating the reader fails
func GetGeoData() (*geoip2.Reader, error) {
	return geoip2.FromBytes(GeoData)
}

//go:embed res/providers.txt
var SampleServersData []byte

// GetSampleServersData returns the embedded DNS server list data.
// This function directly returns the SampleServersData byte slice without reading from the filesystem.
// Returns:
//   - []byte: A byte slice containing the DNS server list
//   - error: Always returns nil since data is embedded
func GetSampleServersData() ([]byte, error) {
	return SampleServersData, nil
}

//go:embed res/domains.txt
var DomainsData []byte

// GetDomainsData returns the embedded domain data.
// This function directly returns the DomainsData byte slice without reading from the filesystem.
// Returns:
//   - []byte: A byte slice containing the domain data
//   - error: Always returns nil since data is embedded
func GetDomainsData() ([]byte, error) {
	return DomainsData, nil
}

//go:embed res/template.html
var TemplateHTMLData []byte

// GetTemplateHTML returns the embedded HTML template data.
// This function directly returns the TemplateHTML byte slice without reading from the filesystem.
// Returns:
//   - []byte: A byte slice containing the HTML template data
//   - error: Always returns nil since data is embedded
func GetTemplateHTML() ([]byte, error) {
	return TemplateHTMLData, nil
}
