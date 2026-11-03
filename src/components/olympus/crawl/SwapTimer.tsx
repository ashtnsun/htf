"use client";

import { useEffect, useRef, useState } from "react";
import type { TombSound } from "@/components/olympus/crawl/sound";

/** Seconds at the controls before the family swaps. */
const TURN = 120;
/** How long the swap banner stays up. */
const BANNER_MS = 6000;
const KEY = "olympus3.2:swap";

function loadLeft() {
  try {
    const saved = Number(sessionStorage.getItem(KEY));
    if (saved > 0 && saved <= TURN) return saved;
  } catch {}
  return TURN;
}

/**
 * The family's clock, always on screen under the map: two minutes, then it beeps, the screen says
 * so as loudly as it can, and it starts again. Nothing stops for it, so the game plays on under the
 * banner; only a cutscene holds the clock (`paused`). Kept through a refresh.
 */
export function SwapTimer({ paused, sound }: { paused: boolean; sound: TombSound }) {
  const [left, setLeft] = useState(loadLeft);
  const [banner, setBanner] = useState(0);
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
      const before = Math.ceil(leftRef.current);
      let next = leftRef.current - dt;
      if (next <= 0) {
        next = TURN;
        sound.swap();
        setBanner((n) => n + 1);
      } else if (Math.ceil(next) < before && Math.ceil(next) <= 5) {
        sound.beep();
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
  }, [sound]);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(0), BANNER_MS);
    return () => window.clearTimeout(id);
  }, [banner]);

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
      {banner ? (
        <div key={banner} role="alert" className="crawl-swap">
          <p className="crawl-swap-word font-olympus">Swap!</p>
          <p className="crawl-swap-line font-oracle">Pass the controls to the next player.</p>
        </div>
      ) : null}
    </>
  );
}
