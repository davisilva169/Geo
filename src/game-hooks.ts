import { useEffect, useRef, useState } from "react";
export function usePause(initial = false) {
  const [paused, setPaused] = useState(initial);
  useEffect(() => {
    const pause = () => setPaused(true);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("keydown", key);
    };
  }, []);
  return [paused, setPaused] as const;
}
export function useActiveClock(
  paused: boolean,
  initial: number,
  onTime?: (ms: number) => void,
) {
  const time = useRef(initial);
  const callback = useRef(onTime);
  callback.current = onTime;
  const [display, setDisplay] = useState(initial);
  useEffect(() => {
    if (paused) return;
    let previous = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      time.current += Math.min(500, now - previous);
      previous = now;
      setDisplay(time.current);
      callback.current?.(time.current);
    }, 100);
    return () => clearInterval(id);
  }, [paused]);
  return [display, time] as const;
}
