import { useState, useEffect, useRef } from "react";

/**
 * Hook that tracks elapsed seconds while `isRunning` is true.
 * Returns [elapsedTime, setElapsedTime, startTime, setStartTime].
 */
export function useElapsedTimer(isRunning) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, startTime]);

  return { elapsedTime, setElapsedTime, startTime, setStartTime };
}
