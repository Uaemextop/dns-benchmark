# dnspy - DNS 服务器的可访问性和性能测试工具

[English](./README.en.md) | [中文](./README.md)

## 项目简介

国内 DNS 服务常遭运营商劫持，被插入各种广告，同时存在隐私泄露风险。为了保障安全可靠的上网体验，我们需要寻找值得信赖的 DNS 服务。

现有的同类工具并不多，较为知名的 DNSJumper 仅支持 Windows 平台，且存在数据源较少、评测维度单一等问题。

因此开发了这款工具，用于测试本地网络环境下可用的 DNS 服务器及其性能表现。该工具使用 Golang 编写，跨平台支持 Windows、macOS、Linux。

并且配套提供可视化数据分析面板，让您一目了然地了解可用的 DNS 服务器 😊

**温馨提示**：点击数据分析面板中的柱状图即可复制服务器地址。

**使用流程**：按照下文指导下载测试工具并获得测试结果的 JSON 文件，然后打开数据分析面板网站上传数据即可分析。网站不存储任何数据。

## 数据分析面板预览

![数据分析面板预览](https://github.com/user-attachments/assets/c743f7ba-4d77-4d16-8515-02c0dc99ddfa)

[数据分析面板（内含示例数据）](https://bench.dash.2020818.xyz)

## 使用方式

![dnspy](https://github.com/user-attachments/assets/a499d2fc-ffcd-4b71-a0dd-d6e5839792dd)

### 1. 下载工具

在本仓库的 [releases](https://github.com/xxnuo/dns-benchmark/releases) 页面中，根据您的系统架构下载对应的 `dnspy-*` 文件。

例如：M 系列处理器的 macOS 用户应下载 `dnspy-darwin-arm64` 文件。

### 2. 准备测试环境

**重要提示**：必须关闭所有代理软件的 Tun 模式、虚拟网卡模式，否则会严重影响测试结果的准确性。

### 3. 运行测试

将下载的文件重命名为 `dnspy`（Windows 系统为 `dnspy.exe`），然后打开终端，切换到该文件所在的目录，执行以下命令：

```bash
unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY
./dnspy
```

按照提示输入即可开始测试。

### 4. 测试说明

程序默认使用多线程模式以加快测试速度。

> **性能要求**：默认参数（10 个线程）需要至少上下行 1 MB/s 的网络带宽和至少 4 核心处理器。
>
> 如果网络或处理器性能不足，可能导致测试结果不准确，建议通过 `-w` 参数降低线程数。

测试完成后，结果将输出到当前目录下，文件名格式为 `dnspy_result_2024-11-07-17-32-13.json`。

### 5. 查看结果

按程序提示输入 `Y` 或 `y` 或直接按回车键，程序将自动打开数据分析面板网站。点击网站右上角的"读取分析"按钮，选择刚生成的 JSON 文件，即可查看可视化测试结果。

## 可用参数

```bash
~> dnspy -h

使用示例:

  dnspy
    使用内置的世界所有域名直接启动测试

  dnspy -s 114.114.114.114
    测试单个服务器

  dnspy dnspy_benchmark_2024-10-22-08-18.json
    对测试结果进行可视化分析

参数说明:
  -c, --concurrency int   每个测试的并发数
                          (默认 10)

  -d, --domains string    要批量测试的域名数据存储的文件路径
                          必须是相对当前程序工作路径的文件路径
                          文件内部格式为每行一条域名
                          不修改则使用内置的 10000 个热门域名
                          (默认 "@sampleDomains@")

  -t, --duration int      每个测试的持续时间，单位：秒
                          (默认 10)

  -f, --file string       要批量测试的服务器数据存储的文件路径
                          必须是相对当前程序工作路径的文件路径
                          文件内部格式为每行一条服务器地址

  -g, --geo string        独立功能：使用 GeoIP 数据库进行 IP 或域名归属地查询

      --json              以 JSON 格式输出日志

  -l, --level string      日志级别
                          可选：debug、info、warn、error、fatal、panic
                          (默认 "info")

      --no-aaaa           每个测试不解析 AAAA 记录（不测试 IPv6）

      --old-html          已弃用，不建议使用
                          建议改用新方式：程序先输出数据 JSON 文件，按提示查看可视化分析
                          下次需要查看时，直接用程序打开 JSON 文件
                          本参数使用旧版方式输出单个 HTML 文件到数据 JSON 同目录
                          可双击打开查看

  -o, --output string     输出结果的文件路径
                          必须是相对当前程序工作路径的文件路径
                          不指定则输出到当前工作路径下的 dnspy_result_<当前时间>.json

      --prefer-ipv4       在 DNS 服务器的域名转换为 IP 地址过程中优先使用 IPv4 地址
                          (默认 true)

  -s, --server strings    手动指定要测试的服务器，支持多个

  -w, --worker int        同一时间测试多少个 DNS 服务器
                          (默认 20)
```

## 编译

### 编译环境要求

- 你的电脑上需要有 `Go` 环境、`curl` 命令
- 最好有 `make` 命令，否则可能需要手动执行 `Makefile` 中的内容
- 能够访问 GitHub 下载资源文件
- 如果在 Windows 下出现以下问题，请改用 `Git Bash` 执行命令

```
'GOOS' is not recognized as an internal or external command,
operable program or batch file.
```

### 编译步骤

#### 1. 克隆本仓库

```bash
git clone https://github.com/xxnuo/dns-benchmark.git
cd dns-benchmark/dnspy
```

#### 2. 更新数据文件（可选）

```bash
make update
```

#### 3. 配置依赖

```bash
make configuration
```

#### 4. 进行编译

```bash
make build
```

编译完成后，生成的可执行文件将位于当前目录下。

## 许可证

本项目采用开源许可证，欢迎贡献代码和提出建议。
