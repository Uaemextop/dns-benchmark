package main

import (
	"testing"
)

func TestCheckGeo(t *testing.T) {
	// Initialize GeoIP database
	geoDB, err := InitGeoDB()
	if err != nil {
		t.Fatalf("Failed to initialize GeoIP database: %v", err)
	}
	defer geoDB.Close()

	serversOK := []string{
		"1.1.1.1:53",
		"114.114.114.114",

		"119.29.29.29",
		"2402:4e00::",
		"https://dns.google/dns-query",
		"tls://dns.cloudflare.com",
		"quic://dns.google:853",
		"1.1.1.1:5353",
		// Special cases
		"https://freedns.controld.com/p3",
		"https://dns.bebasid.com/unfiltered",
		"2620:119:53::53",
		"https://doh.cleanbrowsing.org/doh/family-filter/",
		// Edge cases
		"https://1:1:1:1:1:1",
	}
	serversErr := []string{
		"192.168.1.1",
		"https://dns.goooooogle/dns-query",
		"",
	}

	// Test valid server addresses
	for _, server := range serversOK {
		t.Run(server, func(t *testing.T) {
			ip, geoCode, err := CheckGeo(geoDB, server, true)
			if err != nil {
				t.Errorf("CheckGeo(%s) failed: %v", server, err)
			} else {
				t.Logf("CheckGeo(%s) succeeded: IP=%s, GeoCode=%s", server, ip, geoCode)
			}
		})
	}

	// Test invalid server addresses
	for _, server := range serversErr {
		t.Run(server, func(t *testing.T) {
			ip, geoCode, err := CheckGeo(geoDB, server, true)
			if err == nil {
				t.Errorf("CheckGeo(%s) should have failed but succeeded: IP=%s, GeoCode=%s", server, ip, geoCode)
			} else {
				t.Logf("CheckGeo(%s) expected failure: %v", server, err)
			}
		})
	}
}
