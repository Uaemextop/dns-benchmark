package main

import (
	log "github.com/sirupsen/logrus"
)

func InitLog(isJSON bool, logLevel string) {
	// Set log format
	if isJSON {
		log.SetFormatter(&log.JSONFormatter{})
	} else {
		log.SetFormatter(&log.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05", // Short time format
			DisableQuote:    true,                  // Disable field quoting
		})
	}

	// Set log level
	var _logLevel log.Level
	switch logLevel {
	case "debug":
		_logLevel = log.DebugLevel
	case "info":
		_logLevel = log.InfoLevel
	case "warn":
		_logLevel = log.WarnLevel
	case "error":
		_logLevel = log.ErrorLevel
	case "fatal":
		_logLevel = log.FatalLevel
	case "panic":
		_logLevel = log.PanicLevel
	}
	log.SetLevel(_logLevel)
}
