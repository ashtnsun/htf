"use client";

import { useEffect, useRef, useState } from "react";
import {
  dinoFrame,
  DINO_FOOT_X,
  DINO_H,
  drawWord,
  duckFrame,
  fromRows,
  kept,
} from "@/components/olympus/crawl/art";
import type { Look } from "@/components/olympus/crawl/cosmetics";
import type { TombSound } from "@/components/olympus/crawl/sound";
import { OlympusButton } from "@/components/olympus/OlympusButton";

const W = 320;
const H = 112;
const GROUND = 90;
const PX = 40;
/** The score counts a hundred a second; a coin comes back every five seconds lived. */
const COIN_EVERY = 5;
/**
 * Seconds in, ten coins earned in one run, and the machine stops being fair: over a few seconds it
 * gets half as fast again, the gaps close to about the least a perfect jump can clear, and half of
 * what comes flies, so every gap asks for a different answer. Still just possible, not a wall.
 */
const BRUTAL_AT = 10 * COIN_EVERY;
const BRUTAL_RAMP = 3;
/** Milliseconds after a run ends before Space starts the next. The button works at once. */
const RESTART_AFTER = 700;

const MARBLE = { "#": "#e8e4d8", "+": "#a8a294", "-": "#6f6a5e" };
const TERRACOTTA = { o: "#c96f33", O: "#8e4a1f", k: "#14100c" };
const BRONZE = { b: "#b08d57", B: "#e0bd7a", k: "#14100c", r: "#b3263a" };
const OWL = { o: "#a98a5e", O: "#6f5636", w: "#efe6d2", k: "#14100c", y: "#e9c46a" };

/** A whole column: capital, fluted shaft, base. */
const column = (h: number) => [
  "#########",
  ".#######.",
  "..+###-..",
  ...Array.from({ length: Math.max(2, h - 5) }, () => "..#+#+-.."),
  ".+#####-.",
  "#########",
];
/** What is left of one: a broken top, no capital. */
const broken = (h: number) => [
  "...#.....",
  "..##.#...",
  "..#+#+-..",
  ...Array.from({ length: Math.max(1, h - 5) }, () => "..#+#+-.."),
  ".+#####-.",
  "#########",
];
const AMPHORA = [
  "..ooooooo..",
  "...ooooo...",
  "...ooooo...",
  ".o.ooooo.o.",
  "o..ooooo..o",
  "o.ooooooo.o",
  ".kkkkkkkkk.",
  "kokkokkokko",
  "kkkkkkkkkkk",
  ".ooooooooo.",
  "..OoooooO..",
  "...OoooO...",
  "....OoO....",
  "...ooooo...",
];
const HELM = [
  "...rrrrr...",
  "..rrrrrrr..",
  ".bbbbbbbbb.",
  "bBBBBBBBBBb",
  "bBBBBBBBBBb",
  "bBBkkBBkkBb",
  "bBBkkBBkkBb",
  "bBBBBkBBBBb",
  "bBBB.k.BBBb",
  "bBB..k..BBb",
  ".bb.....bb.",
  "...#####...",
  "...#####...",
  "..#######..",
];
const OWL_UP = [
  "oo..........oo",
  "ooo..oooo..ooo",
  ".ooooowwooooo.",
  "..ookwwwkoo...",
  "...ooyyoo.....",
  "...oOOOOo.....",
  "....oOOo......",
  ".....yy.......",
];
const OWL_DOWN = [
  "..............",
  ".....oooo.....",
  "..oooowwoooo..",
  ".oookwwwkooo..",
  "oo.ooyyoo..oo.",
  "o..oOOOOo...o.",
  "....oOOo......",
  ".....yy.......",
];
const JAVELIN = [
  "BB........................",
  "BBBBbbbbbbbbbbbbbbbbbbbbbb",
  "BB........................",
];

/** A crescent, whole cells: the disc less the same disc moved over. */
const MOON = Array.from({ length: 15 }, (_, y) =>
  Array.from({ length: 15 }, (_, x) => {
    const inDisc = (x - 7) ** 2 + (y - 7) ** 2 <= 49;
    const inBite = (x - 11) ** 2 + (y - 5) ** 2 <= 42;
    return inDisc && !inBite ? "#" : ".";
  }).join(""),
);

const picture = (key: string, rows: readonly string[], inks: Record<string, string>) =>
  kept(`run:${key}`, () => fromRows(rows, inks));

type Kind = "column" | "broken" | "amphora" | "helm" | "owl" | "javelin";
type Obstacle = { kind: Kind; x: number; w: number; h: number; lift: number; count: number };

/**
 * The Dino Game on the den's machine, with the player's own dinosaur in its own clothes: the runner
 * everyone knows, on a Greek shore at night. Columns standing and broken, amphorae and helms to
 * jump, owls and javelins overhead. It starts quick and gets hard very fast.
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
    private sound: TombSound,
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
    if (this.running && this.height === 0) {
      this.vy = 262;
      this.sound.hop();
    }
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

  /** How far past ten coins this run is, 0 to 1. */
  private get brutal() {
    return Math.max(0, Math.min(1, (this.t - BRUTAL_AT) / BRUTAL_RAMP));
  }

  private spawn() {
    const x = W + 4;
    const flying = this.t > 5 && Math.random() < (this.brutal > 0 ? 0.5 : 0.3);
    if (flying) {
      // Low ones are jumped; high ones have to be ducked.
      const high = Math.random() < 0.5;
      const lift = high ? 15 : 8;
      if (Math.random() < 0.5) {
        this.obstacles.push({ kind: "owl", x, w: 14, h: 8, lift, count: 1 });
      } else {
        this.obstacles.push({ kind: "javelin", x, w: 26, h: 3, lift: lift + 2, count: 1 });
      }
      return;
    }
    const roll = Math.random();
    if (roll < 0.2) {
      this.obstacles.push({ kind: "amphora", x, w: 11, h: 14, lift: 0, count: 1 });
    } else if (roll < 0.35) {
      this.obstacles.push({ kind: "helm", x, w: 11, h: 14, lift: 0, count: 1 });
    } else {
      const tall = this.t > 8 ? 26 : 20;
      const h = 12 + Math.floor(Math.random() * (tall - 11));
      const count = 1 + Math.floor(Math.random() * Math.min(3, 1 + this.t / 5));
      const kind: Kind = Math.random() < 0.4 ? "broken" : "column";
      this.obstacles.push({ kind, x, w: count * 10 - 1, h, lift: 0, count });
    }
  }

  private step(dt: number) {
    this.t += dt;
    // Hard very fast: three times the starting speed within fifteen seconds.
    this.speed = Math.min(540, 170 + this.t * 24) + 260 * this.brutal;
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
      this.spawn();
      // The gaps close up with the speed, down to just enough to land and go again.
      const tight = Math.max(0.5, 1.15 - this.t * 0.04) - 0.16 * this.brutal;
      this.nextIn = this.speed * (tight + Math.random() * (0.55 - 0.29 * this.brutal));
    }

    const left = PX - (this.ducking ? 10 : 7);
    const right = PX + (this.ducking ? 13 : 8);
    const low = this.height;
    const high = this.height + (this.ducking && this.height === 0 ? 12 : 21);
    for (const o of this.obstacles) {
      if (o.x < right && o.x + o.w > left && o.lift < high && o.lift + o.h > low) {
        this.stop();
        this.draw();
        this.sound.hurt();
        this.onOver(this.score);
        return;
      }
    }
  }

  private drawObstacle(o: Obstacle) {
    const { ctx } = this;
    const x = Math.round(o.x);
    const bottom = GROUND - o.lift;
    if (o.kind === "column" || o.kind === "broken") {
      const rows = o.kind === "column" ? column(o.h) : broken(o.h);
      const art = picture(`${o.kind}:${o.h}`, rows, MARBLE);
      for (let i = 0; i < o.count; i += 1) ctx.drawImage(art, x + i * 10, bottom - art.height);
    } else if (o.kind === "amphora") {
      const art = picture("amphora", AMPHORA, TERRACOTTA);
      ctx.drawImage(art, x, bottom - art.height);
    } else if (o.kind === "helm") {
      const art = picture("helm", HELM, { ...BRONZE, "#": MARBLE["+"] });
      ctx.drawImage(art, x, bottom - art.height);
    } else if (o.kind === "owl") {
      const up = Math.floor(this.t * 10) % 2 === 0;
      const art = up ? picture("owl-up", OWL_UP, OWL) : picture("owl-down", OWL_DOWN, OWL);
      ctx.drawImage(art, x, bottom - art.height);
    } else {
      const art = picture("javelin", JAVELIN, BRONZE);
      ctx.drawImage(art, x, bottom - art.height);
    }
  }

  draw() {
    const { ctx } = this;
    // A night sky over the water, stars fixed, a low moon.
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#101a30";
    ctx.fillRect(0, 54, W, 36);
    ctx.fillStyle = "#c9c4b0";
    for (let i = 0; i < 40; i += 1) {
      ctx.fillRect((i * i * 37 + i * 113) % W, (i * i * 17 + i * 59) % 52, 1, 1);
    }
    ctx.drawImage(picture("moon", MOON, { "#": "#e8e4d0" }), 238, 14);

    // A temple on the far shore, going by slowly.
    const far = Math.floor((this.t * this.speed * 0.1) % 200);
    ctx.fillStyle = "#1a2540";
    for (let i = -1; i < 3; i += 1) {
      const x = i * 200 - far;
      for (let s = 0; s < 6; s += 1) ctx.fillRect(x + 50 - s * 4, GROUND - 40 + s, 8 + s * 8, 1);
      ctx.fillRect(x + 28, GROUND - 34, 52, 3);
      for (let c = 0; c < 6; c += 1) ctx.fillRect(x + 30 + c * 9, GROUND - 31, 4, 31);
      ctx.fillRect(x + 26, GROUND - 2, 56, 2);
      // An olive tree, further along.
      ctx.fillRect(x + 134, GROUND - 12, 3, 12);
      ctx.fillRect(x + 126, GROUND - 20, 19, 9);
      ctx.fillRect(x + 130, GROUND - 24, 11, 5);
    }

    // The ground, the Greek key running under it.
    ctx.fillStyle = "#c9a877";
    ctx.fillRect(0, GROUND, W, 1);
    ctx.fillStyle = "#2a2014";
    ctx.fillRect(0, GROUND + 1, W, H - GROUND - 1);
    const near = Math.floor(this.t * this.speed) % 12;
    ctx.fillStyle = "#8a6a3a";
    for (let x = -near; x < W; x += 12) {
      const y = GROUND + 6;
      ctx.fillRect(x, y, 10, 2);
      ctx.fillRect(x, y, 2, 10);
      ctx.fillRect(x, y + 8, 8, 2);
      ctx.fillRect(x + 6, y + 4, 2, 6);
      ctx.fillRect(x + 4, y + 4, 2, 2);
    }

    for (const o of this.obstacles) this.drawObstacle(o);

    const foot = GROUND - Math.round(this.height);
    const step = this.height > 0 ? 0 : this.running ? Math.floor(this.t * 12) % 4 : 0;
    if (this.ducking && this.height === 0) {
      ctx.drawImage(duckFrame(step % 2, this.look), PX - 11, foot - 12);
    } else {
      ctx.drawImage(dinoFrame(step, false, false, this.look), PX - DINO_FOOT_X, foot - DINO_H);
    }
    const pad = (n: number) => String(n).padStart(5, "0");
    drawWord(ctx, `HI ${pad(Math.max(this.best(), this.score))}`, 224, 5, "#8c8778");
    drawWord(ctx, pad(this.score), 292, 5, "#efe6d2");
    if (this.flash >= 0 && this.t - this.flash < 0.8) drawWord(ctx, "COIN", 292, 15, "#e9c46a");
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
  sound,
}: {
  look: Look;
  coins: number;
  best: number;
  onPay: () => void;
  onCoin: () => void;
  onBest: (score: number) => void;
  sound: TombSound;
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
  // When the last run ended: a jump mashed as the dinosaur dies must not spend the next coin.
  const overAt = useRef(0);

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
        overAt.current = performance.now();
        setLast({ score, earned: earned.current });
        if (score > bestRef.current) handlers.current.onBest(score);
        setPhase("over");
      },
      sound,
    );
    gameRef.current = game;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __run: RunGame }).__run = game;
    }
    return () => game.stop();
  }, [look, sound]);

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
        else if (performance.now() - overAt.current > RESTART_AFTER) start.current();
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
      <p className="crawl-marquee font-olympus">Dino Game</p>
      <div className="crawl-screen">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="The Dino Game. Space jumps, the down arrow ducks."
        />
        {phase !== "run" ? (
          <div className="crawl-screen-over">
            {phase === "over" ? (
              <p className="font-olympus text-xl font-semibold tracking-[0.12em] uppercase">
                Score {last.score}
                {last.earned ? ` · ${last.earned} back` : ""}
              </p>
            ) : (
              <p className="font-oracle text-xl italic">A coin to play. 500 pts = 1 coin</p>
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
        <span className="crawl-panel-coins">
          {coins} {coins === 1 ? "coin" : "coins"}
        </span>
      </div>
    </div>
  );
}
