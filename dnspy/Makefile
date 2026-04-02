# Default target
all: run

# Build target
build: 
	@echo "Building..."
	go mod tidy
	GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w" -tags release -o dnspy-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w" -tags release -o dnspy-darwin-arm64 .
	GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -tags release -o dnspy-linux-amd64 .
	GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -tags release -o dnspy-linux-arm64 .
	GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -tags release -o dnspy-windows-amd64.exe .
	GOOS=windows GOARCH=arm64 go build -ldflags "-s -w" -tags release -o dnspy-windows-arm64.exe .

# Run target
run:
	@echo "Running..."
	go run .

# Update geographic data (City-level for better US/Mexico coverage)
update-geodata:
	@echo "Updating geographic data (City-level)..."
	curl -L https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb -o ./res/GeoLite2-City.mmdb

# Update domain data
update-domains:
	@echo "Updating domain data..."
	curl https://cdn.jsdelivr.net/gh/Tantalor93/dnspyre@master/data/10000-domains -o ./res/domains.txt

# Update dnspyre executable
configuration:
	@echo "Updating dnspyre executable..."
	@echo "Do not modify the dnspyre version number, otherwise dnspy will not work properly"
	go get github.com/tantalor93/dnspyre/v3@latest
	GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w" -o ./res/dnspyre-darwin-amd64 github.com/tantalor93/dnspyre/v3
	GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w" -o ./res/dnspyre-darwin-arm64 github.com/tantalor93/dnspyre/v3
	GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o ./res/dnspyre-linux-amd64 github.com/tantalor93/dnspyre/v3
	GOOS=linux GOARCH=arm64 go build -ldflags "-s -w" -o ./res/dnspyre-linux-arm64 github.com/tantalor93/dnspyre/v3
	GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o ./res/dnspyre-windows-amd64.exe github.com/tantalor93/dnspyre/v3
	GOOS=windows GOARCH=arm64 go build -ldflags "-s -w" -o ./res/dnspyre-windows-arm64.exe github.com/tantalor93/dnspyre/v3


update: update-geodata update-domains

.PHONY: all build run clean update-geodata update-caller update-domains
