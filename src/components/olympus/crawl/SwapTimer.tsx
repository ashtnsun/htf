"use client";

import { useEffect, useRef, useState } from "react";

/** Seconds at the controls before the family swaps. */
const TURN = 120;
/** How long the word stays on screen. */
const FLASH_MS = 1500;
const KEY = "olympus3.3:swap";

function loadLeft() {
  try {
    const saved = Number(sessionStorage.getItem(KEY));
    if (saved > 0 && saved <= TURN) return saved;
  } catch {}
  return TURN;
}

/**
 * The family's clock, always on screen under the map: two minutes, then a big green SWAP! for a
 * second and a half, and it starts again. It makes no sound and nothing stops for it; only a cutscene or the
 * opening fall holds it (`paused`). Kept through a refresh.
 */
export function SwapTimer({ paused }: { paused: boolean }) {
  const [left, setLeft] = useState(loadLeft);
  const [flash, setFlash] = useState(0);
  const leftRef = useRef(left);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  });

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (pausedRef.current) return;
      let next = leftRef.current - dt;
      if (next <= 0) {
        next = TURN;
        setFlash((n) => n + 1);
      }
      leftRef.current = next;
      setLeft(next);
      try {
        sessionStorage.setItem(KEY, next.toFixed(1));
      } catch {}
    }, 200);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __swap: (s: number) => void }).__swap = (s) => {
        leftRef.current = s;
      };
    }
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(0), FLASH_MS);
    return () => window.clearTimeout(id);
  }, [flash]);

  const whole = Math.ceil(left);
  const minutes = Math.floor(whole / 60);
  const seconds = String(whole % 60).padStart(2, "0");

  return (
    <>
      <div
        role="timer"
        aria-label={`Swap players in ${minutes} minutes ${seconds} seconds`}
        data-urgent={whole <= 10 ? "" : undefined}
        data-paused={paused ? "" : undefined}
        className="crawl-timer font-olympus"
      >
        <span className="crawl-timer-label">Swap in</span>
        <span className="crawl-timer-time">
          {minutes}:{seconds}
        </span>
      </div>
      {flash ? (
        <p key={flash} role="alert" className="crawl-swap font-olympus">
          Swap!
        </p>
      ) : null}
    </>
  );
}
