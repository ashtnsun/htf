"use client";

import { useEffect, useRef, useState } from "react";
import {
  C,
  dinoFrame,
  DINO_FOOT_X,
  DINO_H,
  drawWord,
  duckFrame,
} from "@/components/olympus/crawl/art";
import type { Look } from "@/components/olympus/crawl/cosmetics";
import { OlympusButton } from "@/components/olympus/OlympusButton";

const W = 320;
const H = 112;
const GROUND = 92;
const PX = 40;
/** The score counts a hundred a second; a coin comes back every five seconds lived. */
const COIN_EVERY = 5;

type Obstacle = { x: number; w: number; h: number; lift: number; bat: boolean };

/**
 * The classic runner on the den's machine, with the player's own dinosaur in its own clothes, and
 * broken columns and bats for the cacti and birds. It starts quick and gets hard very fast.
 */
class RunGame {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  height = 0;
  private vy = 0;
  ducking = false;
  private falling = false;
  obstacles: Obstacle[] = [];
  private nextIn = 200;
  t = 0;
  speed = 170;
  private paid = 0;
  private flash = -1;
  running = false;

  constructor(
    canvas: HTMLCanvasElement,
    private look: Look,
    private best: () => number,
    private onCoin: () => void,
    private onOver: (score: number) => void,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.draw();
  }

  get score() {
    return Math.floor(this.t * 100);
  }

  start() {
    this.height = 0;
    this.vy = 0;
    this.ducking = false;
    this.falling = false;
    this.obstacles = [];
    this.nextIn = 180;
    this.t = 0;
    this.paid = 0;
    this.flash = -1;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  jump() {
    if (this.running && this.height === 0) this.vy = 262;
  }

  duck(on: boolean) {
    this.ducking = on;
    this.falling = on && this.height > 0;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    // The first frame can be stamped a moment before the clock was read.
    const dt = Math.max(0, Math.min(0.04, (now - this.last) / 1000));
    this.last = now;
    this.step(dt);
    this.draw();
  };

  private step(dt: number) {
    this.t += dt;
    // Hard very fast: three times the starting speed within fifteen seconds.
    this.speed = Math.min(540, 170 + this.t * 24);
    const paid = Math.floor(this.t / COIN_EVERY);
    if (paid > this.paid) {
      this.paid = paid;
      this.flash = this.t;
      this.onCoin();
    }

    this.vy -= (this.falling ? 2400 : 920) * dt;
    this.height = Math.max(0, this.height + this.vy * dt);
    if (this.height === 0) {
      this.vy = 0;
      this.falling = false;
    }

    for (const o of this.obstacles) o.x -= this.speed * dt;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -4);
    this.nextIn -= this.speed * dt;
    if (this.nextIn <= 0) {
      const bats = this.t > 5 && Math.random() < 0.3;
      if (bats) {
        // Low ones are jumped; high ones have to be ducked.
        const high = Math.random() < 0.5;
        this.obstacles.push({ x: W + 4, w: 14, h: 8, lift: high ? 15 : 8, bat: true });
      } else {
        const tall = this.t > 8 ? 26 : 20;
        const count = 1 + Math.floor(Math.random() * Math.min(3, 1 + this.t / 5));
        const h = 12 + Math.floor(Math.random() * (tall - 11));
        this.obstacles.push({ x: W + 4, w: count * 8, h, lift: 0, bat: false });
      }
      // The gaps close up with the speed, down to just enough to land and go again.
      const tight = Math.max(0.5, 1.15 - this.t * 0.04);
      this.nextIn = this.speed * (tight + Math.random() * 0.55);
    }

    const left = PX - (this.ducking ? 10 : 7);
    const right = PX + (this.ducking ? 13 : 8);
    const low = this.height;
    const high = this.height + (this.ducking && this.height === 0 ? 12 : 21);
    for (const o of this.obstacles) {
      if (o.x < right && o.x + o.w > left && o.lift < high && o.lift + o.h > low) {
        this.stop();
        this.draw();
        this.onOver(this.score);
        return;
      }
    }
  }

  draw() {
    const { ctx } = this;
    ctx.fillStyle = "#0b0a12";
    ctx.fillRect(0, 0, W, H);
    // Far off, the ruins go by slowly.
    const far = Math.floor((this.t * this.speed * 0.12) % 120);
    ctx.fillStyle = "#1e1c2e";
    for (let i = -1; i < 5; i += 1) {
      const x = i * 120 - far;
      ctx.fillRect(x + 8, GROUND - 26, 44, 3);
      for (let c = 0; c < 4; c += 1) ctx.fillRect(x + 10 + c * 13, GROUND - 23, 4, 23);
      ctx.fillRect(x + 76, GROUND - 12, 5, 12);
    }
    // The ground runs under.
    ctx.fillStyle = "#aca7c3";
    ctx.fillRect(0, GROUND, W, 1);
    const near = Math.floor(this.t * this.speed) % 26;
    ctx.fillStyle = "#585373";
    for (let x = -near; x < W; x += 26) {
      ctx.fillRect(x, GROUND + 3, 6, 1);
      ctx.fillRect(x + 13, GROUND + 7, 3, 1);
    }
    for (const o of this.obstacles) {
      const x = Math.round(o.x);
      const top = GROUND - o.lift - o.h;
      if (o.bat) {
        const up = Math.floor(this.t * 10) % 2 === 0;
        ctx.fillStyle = "#ff3d9e";
        ctx.fillRect(x + 5, top + 2, 4, 4);
        ctx.fillRect(x, top + (up ? 0 : 4), 5, 2);
        ctx.fillRect(x + 9, top + (up ? 0 : 4), 5, 2);
      } else {
        for (let c = 0; c < o.w; c += 8) {
          ctx.fillStyle = "#dfdcec";
          ctx.fillRect(x + c, top, 7, o.h);
          ctx.fillStyle = "#7e7999";
          ctx.fillRect(x + c + 2, top + 1, 1, o.h - 1);
          ctx.fillRect(x + c + 5, top + 1, 1, o.h - 1);
          ctx.fillStyle = "#aca7c3";
          ctx.fillRect(x + c - 1, GROUND - 2, 9, 2);
        }
      }
    }
    const foot = GROUND - Math.round(this.height);
    const step = this.height > 0 ? 0 : this.running ? Math.floor(this.t * 12) % 4 : 0;
    if (this.ducking && this.height === 0) {
      ctx.drawImage(duckFrame(step % 2, this.look), PX - 11, foot - 13);
    } else {
      ctx.drawImage(dinoFrame(step, false, false, this.look), PX - DINO_FOOT_X, foot - DINO_H);
    }
    const pad = (n: number) => String(n).padStart(5, "0");
    drawWord(ctx, `HI ${pad(Math.max(this.best(), this.score))}`, 224, 5, "#7e7999");
    drawWord(ctx, pad(this.score), 292, 5, "#f5f5f5");
    if (this.flash >= 0 && this.t - this.flash < 0.8) {
      drawWord(ctx, "COIN", 292, 15, C.gold);
    }
  }
}

/**
 * The arcade machine, up close. A coin to start; a coin back for every five seconds lived, kept
 * even if the run is abandoned. Space or the up arrow jumps, the down arrow ducks (and drops out of
 * a jump early).
 */
export function DinoRun({
  look,
  coins,
  best,
  onPay,
  onCoin,
  onBest,
}: {
  look: Look;
  coins: number;
  best: number;
  onPay: () => void;
  onCoin: () => void;
  onBest: (score: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<RunGame | null>(null);
  const bestRef = useRef(best);
  const handlers = useRef({ onCoin, onBest });
  const [phase, setPhase] = useState<"ready" | "run" | "over">("ready");
  const [last, setLast] = useState({ score: 0, earned: 0 });
  const earned = useRef(0);
  const coinsRef = useRef(coins);
  const start = useRef<() => void>(() => {});

  useEffect(() => {
    handlers.current = { onCoin, onBest };
    bestRef.current = best;
    coinsRef.current = coins;
  });

  useEffect(() => {
    const game = new RunGame(
      canvasRef.current!,
      look,
      () => bestRef.current,
      () => {
        earned.current += 1;
        handlers.current.onCoin();
      },
      (score) => {
        setLast({ score, earned: earned.current });
        if (score > bestRef.current) handlers.current.onBest(score);
        setPhase("over");
      },
    );
    gameRef.current = game;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __run: RunGame }).__run = game;
    }
    return () => game.stop();
  }, [look]);

  function begin() {
    const game = gameRef.current;
    if (!game || game.running || coinsRef.current < 1) return;
    onPay();
    earned.current = 0;
    setPhase("run");
    game.start();
  }
  useEffect(() => {
    start.current = begin;
  });

  useEffect(() => {
    function down(event: KeyboardEvent) {
      const game = gameRef.current;
      if (!game) return;
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        if (event.repeat) return;
        if (game.running) game.jump();
        else start.current();
      } else if (event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        game.duck(true);
      }
    }
    function up(event: KeyboardEvent) {
      if (event.code === "ArrowDown" || event.code === "KeyS") gameRef.current?.duck(false);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div className="crawl-cabinet journey-rise">
      <p className="crawl-marquee font-olympus">Dino Run</p>
      <div className="crawl-screen">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="The arcade game. Space jumps, the down arrow ducks."
        />
        {phase !== "run" ? (
          <div className="crawl-screen-over">
            {phase === "over" ? (
              <p className="font-olympus text-xl font-semibold tracking-[0.12em] uppercase">
                Score {last.score}
                {last.earned ? ` · ${last.earned} back` : ""}
              </p>
            ) : (
              <p className="font-oracle text-xl italic">
                A coin to play. One back every five seconds you last.
              </p>
            )}
            {coins >= 1 ? (
              <OlympusButton onClick={begin}>
                {phase === "over" ? "Again, one coin" : "Insert one coin"}
              </OlympusButton>
            ) : (
              <p role="status" className="text-sm text-cyan">
                You have no coins.
              </p>
            )}
          </div>
        ) : null}
      </div>
      <div className="crawl-panel font-olympus">
        <span>
          <kbd className="crawl-key">Space</kbd> Jump
        </span>
        <span>
          <kbd className="crawl-key">↓</kbd> Duck
        </span>
        <span className="crawl-panel-coins">{coins} coins</span>
      </div>
    </div>
  );
}
