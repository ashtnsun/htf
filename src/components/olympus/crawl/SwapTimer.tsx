"use client";

import { useEffect, useRef, useState } from "react";

/** Seconds at the controls before the family swaps. */
const TURN = 120;
/** How long the next player's name stays on screen. */
const FLASH_MS = 1500;
/**
 * Seconds the clock holds still after a swap, while they change seats. It reads 2:00 for its first
 * second of counting as well (it rounds up), so this shows 2:00 for ten seconds in all.
 */
const GRACE = 9;

const keyOf = (family: number) => `olympus3.4:swap:${family}`;

function loadTurn(family: number) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(keyOf(family)) ?? "null") as {
      left?: number;
      player?: number;
      grace?: number;
    } | null;
    if (saved?.left && saved.left > 0 && saved.left <= TURN) {
      return { left: saved.left, player: saved.player ?? 0, grace: saved.grace ?? 0 };
    }
  } catch {}
  return { left: TURN, player: 0, grace: 0 };
}

/**
 * The family's clock, under the map, mounted once the photo has given it their names: whose turn it
 * is and how long they have, two minutes each, in the order the photo named them. At the end the next
 * name fills the screen for a second and a half and the clock holds at 2:00 for ten seconds, while they
 * change seats, before it counts down again. It makes no sound and
 * nothing stops for it; only a cutscene holds it (`paused`). Kept through a refresh. A group of one
 * has nobody to swap to, so the clock simply runs.
 */
export function SwapTimer({
  family,
  players,
  paused,
}: {
  family: number;
  players: string[];
  paused: boolean;
}) {
  const [start] = useState(() => loadTurn(family));
  const [left, setLeft] = useState(start.left);
  const [player, setPlayer] = useState(start.player % players.length);
  const [flash, setFlash] = useState<{ id: number; name: string } | null>(null);
  const leftRef = useRef(start.left);
  const playerRef = useRef(start.player % players.length);
  const graceRef = useRef(start.grace);
  const pausedRef = useRef(paused);
  const playersRef = useRef(players);

  useEffect(() => {
    pausedRef.current = paused;
    playersRef.current = players;
  });

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (pausedRef.current) return;
      let next = leftRef.current;
      if (graceRef.current > 0) graceRef.current = Math.max(0, graceRef.current - dt);
      else next -= dt;
      if (next <= 0) {
        next = TURN;
        const order = playersRef.current;
        playerRef.current = (playerRef.current + 1) % order.length;
        setPlayer(playerRef.current);
        if (order.length > 1) {
          graceRef.current = GRACE;
          setFlash((f) => ({ id: (f?.id ?? 0) + 1, name: order[playerRef.current]! }));
        }
      }
      leftRef.current = next;
      setLeft(next);
      try {
        sessionStorage.setItem(
          keyOf(family),
          JSON.stringify({
            left: Number(next.toFixed(1)),
            player: playerRef.current,
            grace: Number(graceRef.current.toFixed(1)),
          }),
        );
      } catch {}
    }, 200);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __swap: (s: number) => void }).__swap = (s) => {
        leftRef.current = s;
      };
    }
    return () => window.clearInterval(id);
  }, [family]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), FLASH_MS);
    return () => window.clearTimeout(id);
  }, [flash]);

  const whole = Math.ceil(left);
  const minutes = Math.floor(whole / 60);
  const seconds = String(whole % 60).padStart(2, "0");
  const current = players[player] ?? "";

  return (
    <>
      <div
        role="timer"
        aria-label={`${current}'s turn, ${minutes} minutes ${seconds} seconds left`}
        data-urgent={whole <= 10 ? "" : undefined}
        data-paused={paused ? "" : undefined}
        className="crawl-timer font-olympus"
      >
        <span className="crawl-timer-label">{current}</span>
        <span className="crawl-timer-time">
          {minutes}:{seconds}
        </span>
      </div>
      {flash ? (
        <div key={flash.id} role="alert" className="crawl-swap font-olympus">
          <p className="crawl-swap-to">Swap to</p>
          {/* Sized to the name, so the longest still fits across the screen on one line. */}
          <p
            className="crawl-swap-name"
            style={{ fontSize: `min(16rem, ${(90 / (flash.name.length * 0.88)).toFixed(1)}vw)` }}
          >
            {flash.name}
          </p>
        </div>
      ) : null}
    </>
  );
}
