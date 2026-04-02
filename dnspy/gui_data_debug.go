//go:build !release

package main

import (
	"fmt"
	"io/fs"
	"os"
)

// GetWebUIFS returns a filesystem rooted at web/dist for serving the web UI.
// In debug mode, this reads from disk instead of embedded data.
func GetWebUIFS() (fs.FS, error) {
	distPath := "./web/dist"
	if _, err := os.Stat(distPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("web UI not built: run 'pnpm build' in the web directory first")
	}
	return os.DirFS(distPath), nil
}
