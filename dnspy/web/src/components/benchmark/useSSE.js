import { useEffect, useRef, useCallback } from "react";

/**
 * Hook that manages the SSE connection for benchmark progress.
 *
 * @param {object} opts
 * @param {Function} opts.onStatus  - Called with status events
 * @param {Function} opts.onProgress - Called with progress events
 * @param {Function} opts.onComplete - Called with complete events
 * @param {Function} opts.onError   - Called with error events
 */
export function useSSE({ onStatus, onProgress, onComplete, onError }) {
  const esRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource("/api/benchmark/status");
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "status":
            onStatus?.(data);
            break;
          case "progress":
            onProgress?.(data);
            break;
          case "complete":
            onComplete?.(data);
            break;
          case "error":
            onError?.(data);
            break;
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    es.onerror = () => {
      setTimeout(() => {
        if (esRef.current === es) connect();
      }, 3000);
    };
  }, [onStatus, onProgress, onComplete, onError]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
    };
  }, [connect]);
}
