# dnspy - DNS Server Performance Testing Tool

[English](./README.md) | [中文](./README.en.md)

## Project Overview

DNS services in many regions are often hijacked by ISPs, injecting various advertisements and causing privacy concerns. To ensure a safe and reliable internet experience, we need to find trustworthy DNS services.

There are not many similar tools available. The well-known DNSJumper only supports Windows and has limitations such as limited data sources and single evaluation dimensions.

Therefore, we developed this tool to test available DNS servers and their performance in your local network environment. This tool is written in Golang and supports cross-platform use on Windows, macOS, and Linux.

Additionally, we provide a visual data analysis dashboard that allows you to easily understand which DNS servers are available 😊

**Pro Tip**: Click on the bar charts in the data analysis dashboard to copy server addresses.

**Usage Flow**: Follow the guide below to download the testing tool and obtain a JSON file with test results, then open the data analysis dashboard website to upload and analyze the data. The website does not store any data.

## Data Analysis Dashboard Preview

![Data Analysis Dashboard Preview](https://github.com/user-attachments/assets/c743f7ba-4d77-4d16-8515-02c0dc99ddfa)

[Data Analysis Dashboard (with Sample Data)](https://bench.dash.2020818.xyz)

## Usage

![dnspy](https://github.com/user-attachments/assets/a499d2fc-ffcd-4b71-a0dd-d6e5839792dd)

### 1. Download the Tool

From the [releases](https://github.com/xxnuo/dns-benchmark/releases) page of this repository, download the corresponding `dnspy-*` file according to your system architecture.

For example: macOS users with M-series processors should download the `dnspy-darwin-arm64` file.

### 2. Prepare Testing Environment

**Important Notice**: You must disable all proxy software's Tun mode and virtual network card mode, otherwise it will severely affect the accuracy of test results.

### 3. Run the Test

Rename the downloaded file to `dnspy` (`dnspy.exe` on Windows), open a terminal, navigate to the directory containing the file, and execute the following commands:

```bash
unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY
./dnspy
```

Follow the prompts to start testing.

### 4. Testing Instructions

The program uses multi-threading mode by default to speed up testing.

> **Performance Requirements**: The default parameters (10 threads) require at least 1 MB/s network bandwidth (both upload and download) and at least a 4-core processor.
>
> If your network or processor performance is insufficient, it may lead to inaccurate test results. It is recommended to reduce the number of threads using the `-w` parameter.

After the test is complete, the results will be output to the current directory with a filename format like `dnspy_result_2024-11-07-17-32-13.json`.

### 5. View Results

Following the program prompt, enter `Y` or `y` or simply press Enter, and the program will automatically open the data analysis dashboard website. Click the "Read Analysis" button in the upper right corner of the website, select the JSON file just generated, and you can view the visualized test results.

## Available Parameters

```bash
~> dnspy -h

Usage examples:

  dnspy
    Start testing directly using built-in worldwide DNS servers

  dnspy -s 114.114.114.114
    Test a single server

  dnspy dnspy_benchmark_2024-10-22-08-18.json
    Visualize and analyze test results

Parameters:
  -c, --concurrency int   Concurrency count for each test
                          (default 10)

  -d, --domains string    File path for domain data to bulk test
                          Must be relative to the current working directory
                          One domain per line
                          Uses built-in 10000 popular domains if not specified
                          (default "@sampleDomains@")

  -t, --duration int      Duration of each test in seconds
                          (default 10)

  -f, --file string       File path for server data to bulk test
                          Must be relative to the current working directory
                          One server address per line

  -g, --geo string        Standalone feature: Query IP or domain geolocation using GeoIP database

      --json              Output logs in JSON format

  -l, --level string      Log level
                          Options: debug, info, warn, error, fatal, panic
                          (default "info")

      --no-aaaa           Do not resolve AAAA records in each test (skip IPv6 testing)

      --old-html          Deprecated, not recommended
                          Recommended: Program outputs a JSON file, follow prompts to view visual analysis
                          To view again later, open the JSON file directly with the program
                          This parameter uses the legacy method to output a single HTML file alongside the JSON data
                          Can be opened by double-clicking

  -o, --output string     Output result file path
                          Must be relative to the current working directory
                          If not specified, outputs to dnspy_result_<current_time>.json in the current directory

      --prefer-ipv4       Prefer IPv4 addresses when resolving DNS server hostnames to IP addresses
                          (default true)

  -s, --server strings    Manually specify server(s) to test (supports multiple)

  -w, --worker int        Number of DNS servers to test simultaneously
                          (default 20)
```

## Compilation

### Compilation Environment Requirements

- You need `Go` environment and `curl` command on your computer
- Preferably have `make` command, otherwise you may need to manually execute contents in `Makefile`
- Ability to access GitHub to download resource files
- If you encounter the following issue on Windows, please use `Git Bash` to execute commands instead

```
'GOOS' is not recognized as an internal or external command,
operable program or batch file.
```

### Compilation Steps

#### 1. Clone This Repository

```bash
git clone https://github.com/xxnuo/dns-benchmark.git
cd dns-benchmark/dnspy
```

#### 2. Update Data Files (Required for first build)

Download the GeoIP database and domain data:

```bash
make update
```

This downloads:
- **GeoLite2-City.mmdb** - City-level GeoIP database for accurate geolocation (supports subdivision/state level for US, Mexico, etc.)
- **domains.txt** - 10,000 popular domains for DNS performance testing

#### 3. Configure Dependencies

```bash
make configuration
```

#### 4. Build

```bash
make build
```

After compilation is complete, the generated executable file will be located in the current directory.

## License

This project is open source. Contributions and suggestions are welcome.
