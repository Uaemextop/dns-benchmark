//go:build release

package main

import (
	"embed"
	"io/fs"
)

//go:embed web/dist/*
var webUIFS embed.FS

// GetWebUIFS returns a filesystem rooted at web/dist for serving the web UI.
func GetWebUIFS() (fs.FS, error) {
	return fs.Sub(webUIFS, "web/dist")
}
