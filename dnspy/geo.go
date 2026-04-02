package main

import (
	"fmt"
	"net"
	"strconv"
	"strings"

	"github.com/oschwald/geoip2-golang"
)

func InitGeoDB() (*geoip2.Reader, error) {
	return GetGeoData()
}

func checkIPGeo(geoDB *geoip2.Reader, ip net.IP) (string, error) {
	record, err := geoDB.City(ip)
	if err != nil {
		return "CDN", err
	}
	if record.Country.IsoCode == "" {
		return "CDN", nil
	}
	// Return country code with subdivision (state/region) if available
	// This provides better granularity for countries like US and MX
	if len(record.Subdivisions) > 0 && record.Subdivisions[0].IsoCode != "" {
		return record.Country.IsoCode + "-" + record.Subdivisions[0].IsoCode, nil
	}
	return record.Country.IsoCode, nil
}

// Handle encrypted DNS addresses,
// Example return values:
// 208.67.220.123,208.67.220.123,US
// https://doh.familyshield.opendns.com/dns-query,146.112.41.3,US
// tls://familyshield.opendns.com,208.67.222.123,US
// https://freedns.controld.com/p3,...
// https://dns.bebasid.com/unfiltered,...
// 2620:119:53::53,...
// https://doh.cleanbrowsing.org/doh/family-filter/,...
func CheckGeo(geoDB *geoip2.Reader, _server string, preferIPv4 bool) (string, string, error) {
	server := strings.TrimSpace(_server)
	server = strings.TrimSuffix(server, "/")
	if server == "" {
		return "0.0.0.0", "PRIVATE", fmt.Errorf("server address is empty")
	}
	var ip net.IP
	if strings.Contains(server, "://") {
		// URL
		server = strings.TrimPrefix(server, "https://")
		server = strings.TrimPrefix(server, "tls://")
		server = strings.TrimPrefix(server, "quic://")
		server = strings.TrimPrefix(server, "http://")

		if strings.Contains(server, "/") {
			// Has path
			parts := strings.SplitN(server, "/", 2)
			server = parts[0]
		}
		if strings.Contains(server, "[") && strings.Contains(server, "]") {
			// IPv6 address
			server = strings.SplitN(server, "]", 2)[0]
			server = strings.TrimPrefix(server, "[")
		} else if strings.Contains(server, ":") {
			// Regular URL with port
			parts := strings.SplitN(server, ":", 2)
			server = parts[0]
		}
		// Resolve to IP
		ips, err := net.LookupIP(server)
		ipc := len(ips)
		if err != nil || ipc == 0 {
			// Cannot resolve IP address
			return "0.0.0.0", "PRIVATE", fmt.Errorf("cannot resolve IP address")
		}
		if ipc == 1 {
			// Only one IP address
			ip = ips[0]
		} else {
			// Multiple IP addresses
			if preferIPv4 {
				for _, _ip := range ips {
					if _ip.To4() != nil {
						ip = _ip
						break
					}
				}
				if ip == nil {
					ip = ips[0]
				}
			} else {
				ip = ips[0]
			}
		}
	} else {
		// IP or hostname like localhost
		parts := strings.SplitN(server, ":", 2)
		if len(parts) > 1 {
			what := parts[1]
			whatInt, err := strconv.Atoi(what)
			if err == nil && whatInt > 0 && whatInt < 65536 {
				// Port
				server = parts[0]
			}
		}

		ips, err := net.LookupIP(server)
		if err != nil || len(ips) == 0 {
			return "0.0.0.0", "PRIVATE", fmt.Errorf("local resolver cannot resolve host IP address")
		}
		ip = ips[0]
	}
	if ip.IsPrivate() || ip.IsUnspecified() {
		return ip.String(), "PRIVATE", nil
	}
	geoCode, err := checkIPGeo(geoDB, ip)
	return ip.String(), geoCode, err
}
