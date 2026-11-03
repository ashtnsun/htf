import { CRACK, SEAL } from "@/components/olympus/journey/Seal";
import {
  brazierPicture,
  C,
  dinoFrame,
  DINO_FOOT_X,
  DINO_H,
  drawFlame,
  drawGlyphs,
  drawLetter,
  drawPathStone,
  drawSquareTile,
  drawWord,
  fromRows,
  kept,
  lightPicture,
  tintPicture,
  makeCanvas,
  paintRoom,
  propPicture,
  rng,
} from "@/components/olympus/crawl/art";
import type { TombSound } from "@/components/olympus/crawl/sound";
import {
  arrival,
  DOOR_HALF,
  interior,
  OPPOSITE,
  ROOM_LIST,
  ROOMS,
  SQUARE,
  solidOf,
  solidOfFire,
  TILE,
  type Fire,
  type Room,
  type RoomId,
  type Side,
  type Spot,
  type Target,
} from "@/components/olympus/crawl/world";

/**
 * The tomb's game loop: one canvas drawn with `fillRect` and small pictures at a whole number of
 * screen pixels per cell, so everything stays on its grid. Rooms are painted once; each frame draws
 * the room, what moves, then a small dark layer with pools of light cut out of it (dithered, no
 * blur). Nothing here touches React: the shell (Crawl.tsx) hears about prompts, rooms and
 * interactions through `Hooks` and tells the world what has changed through `setFlags`.
 */

export type Flags = {
  photo: HTMLImageElement | null;
  solved: boolean[];
  word: string | null;
  carved: boolean;
  stoneRead: boolean;
  /** The square's five rows, once the seal is broken. */
  square: string[] | null;
  final: string | null;
};

export type Hooks = {
  onPrompt: (label: string | null) => void;
  onInteract: (target: Target) => void;
  onRoom: (room: RoomId, x: number, y: number) => void;
  onStamp: (letters: string) => void;
  onFirstMove: () => void;
};

export type WorldEvent =
  | { kind: "mural" }
  | { kind: "tablet"; index: number }
  | { kind: "word" }
  | { kind: "stone" }
  | { kind: "square" }
  | { kind: "door" };

const SPEED = 104;
const DASH_SPEED = 300;
const DASH_TIME = 0.16;
const DASH_REST = 0.5;
const SLIDE = 0.42;
const FALL = 0.6;
const SPIKE_PERIOD = 2.6;
/** The fires' clock, in milliseconds: as on /olympus. */
const BEAT = { FLARE: 900, AFTER_FLARE: 1400, LIT: 2000, DARK: 700, END: 3200 };
/** How dark a room is away from any fire. */
const AMBIENT = 0.46;

type Beat = { left: number; right: number; ms: number };

function beatsOf(signal: readonly [number, number][]): Beat[] {
  return [
    { left: 5, right: 5, ms: BEAT.FLARE },
    { left: 0, right: 0, ms: BEAT.AFTER_FLARE },
    ...signal.flatMap(([left, right]) => [
      { left, right, ms: BEAT.LIT },
      { left: 0, right: 0, ms: BEAT.DARK },
    ]),
    { left: 0, right: 0, ms: BEAT.END },
  ];
}

type Mote = { x: number; y: number; vx: number; vy: number; life: number; ink: string };

type Item = { y: number; draw: (ctx: CanvasRenderingContext2D, time: number) => void };

type Live = {
  room: Room;
  bg: HTMLCanvasElement;
  items: Item[];
  solids: { x: number; y: number; w: number; h: number }[];
  motes: { x: number; y: number; s: number; p: number }[];
};

const MURAL = { x: 104, y: 4, w: 144, h: 88, ix: 112, iy: 12, iw: 128, ih: 72 };
const GATE = { x: 128, y: 6, w: 96, h: 74 };
const GREAT_DOOR = { x: 152, y: 2, w: 80, h: 62 };

/** Where the camera closes in on each thing, in room pixels. */
function focusOf(target: Target, spot: Spot): { x: number; y: number } {
  switch (target.kind) {
    case "tablet":
      return { x: spot.x, y: 30 };
    case "mural":
      return { x: MURAL.ix + MURAL.iw / 2, y: MURAL.iy + MURAL.ih / 2 };
    case "gate":
      return { x: GATE.x + GATE.w / 2, y: 40 };
    case "stone":
      return { x: spot.x, y: 84 };
    case "door":
      return { x: 192, y: 34 };
    default:
      return { x: spot.x, y: spot.y };
  }
}

export function labelOf(target: Target, flags: Flags): string {
  switch (target.kind) {
    case "tablet":
      return "Read the wall";
    case "mural":
      return flags.photo ? "Look" : "Stand before the wall";
    case "gate":
      return "Touch the gate";
    case "stone":
      return "Turn the wheels";
    case "door":
      return flags.square ? "Speak" : "Touch the seal";
    case "altar":
      return "Take the word";
    case "note":
      return "Look";
  }
}

export class CrawlEngine {
  private ctx: CanvasRenderingContext2D;
  private dark: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
  private live = new Map<RoomId, Live>();
  private raf = 0;
  private last = 0;
  private beats: Beat[];
  private cycle: number;
  private keys = new Set<string>();
  /** Screen pixels per cell, which sets how much of the room is in view. */
  private S = 3;
  /** Canvas pixels per cell: S, until a slow machine steps it down (`watchFrames`). */
  private R = 3;
  private stepsDown = 0;
  private slowSum = 0;
  private slowCount = 0;
  private lastFrame = 0;
  private viewW = 384;
  private viewH = 216;

  private current: Live;
  private x: number;
  private y: number;
  private facing = 1;
  private walked = 0;
  private moving = false;
  private lastStepSound = 0;
  private dashLeft = 0;
  private dashRest = 0;
  private dashX = 0;
  private dashY = 0;
  private hurt = 0;
  private lastSafe: { x: number; y: number };
  private ghosts: { x: number; y: number; step: number; flip: boolean; life: number }[] = [];
  private motes: Mote[] = [];
  private movedOnce = false;
  private paused = false;
  private asleep = false;
  private intro: number;
  private iris = 1;
  private slide: {
    from: Live;
    to: Live;
    fromCam: { x: number; y: number };
    t: number;
    side: Side;
  } | null = null;
  private falling = 0;
  private revealed = new Set<string>();
  private shakeUntil = 0;
  private shakeAmp = 0;
  private flashUntil = 0;
  private prompt: string | null = null;
  private here: Spot | null = null;
  private tile: { r: number; c: number; letter: string } | null = null;
  private stamps: { r: number; c: number }[] = [];
  private flags: Flags;
  private muralStart = -1;
  private squareStart = -1;
  private doorStart = -1;
  private tabletPulse = new Map<number, number>();
  private wordPulse = -1;
  private stonePulse = -1;
  private reduce: boolean;
  private tints: { x: number; y: number; r: number; flare: boolean }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    signal: readonly [number, number][],
    private hooks: Hooks,
    private score: TombSound,
    flags: Flags,
    start: { room: RoomId; x: number; y: number } | null,
    reduce: boolean,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.dark = makeCanvas(1, 1);
    this.beats = beatsOf(signal);
    this.cycle = this.beats.reduce((sum, b) => sum + b.ms, 0);
    this.flags = flags;
    this.reduce = reduce;
    for (const room of ROOM_LIST) this.live.set(room.id, this.build(room));
    this.current = this.live.get(start?.room ?? "ante")!;
    this.x = start?.x ?? 176;
    this.y = start?.y ?? 188;
    this.intro = start || reduce ? 0 : 1.1;
    this.iris = reduce ? 0 : 1;
    this.lastSafe = { x: this.x, y: this.y };
  }

  start() {
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    window.addEventListener("blur", this.clearKeys);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    this.hooks.onRoom(this.current.room.id, this.x, this.y);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    window.removeEventListener("blur", this.clearKeys);
  }

  setFlags(flags: Partial<Flags>) {
    this.flags = { ...this.flags, ...flags };
  }

  setReduce(reduce: boolean) {
    this.reduce = reduce;
  }

  /** The world stops for a close-up; `sleep` also stops drawing (the camera's busy then). */
  pause(sleep = false) {
    this.paused = true;
    this.asleep = sleep;
    this.clearKeys();
    this.setPrompt(null);
  }

  wake() {
    this.asleep = false;
  }

  resume() {
    this.paused = false;
    this.asleep = false;
    this.last = performance.now();
  }

  /** Where the camera should close in on `target`, as fractions of the screen. */
  focus(target: Target) {
    const spot = this.current.room.spots.find((s) => sameTarget(s.target, target));
    if (!spot) return { x: 0.5, y: 0.5 };
    const at = focusOf(target, spot);
    const cam = this.camera(this.current);
    return { x: (at.x - cam.x) / this.viewW, y: (at.y - cam.y) / this.viewH };
  }

  /** Forget the pressed letters: the fires said otherwise, or the word was spoken. */
  clearStamps() {
    this.stamps = [];
    this.hooks.onStamp("");
  }

  /** Something in the world has just changed: show it. */
  play(event: WorldEvent) {
    const now = performance.now();
    switch (event.kind) {
      case "mural":
        this.muralStart = now + 250;
        this.shake(900, 1);
        this.score.chime();
        this.score.stone();
        break;
      case "tablet":
        this.tabletPulse.set(event.index, now);
        this.score.chime();
        break;
      case "word":
        this.wordPulse = now;
        this.shake(700, 2);
        this.score.rumble(0.6);
        this.score.chime();
        break;
      case "stone":
        this.stonePulse = now;
        this.score.chime();
        break;
      case "square":
        this.squareStart = now + 300;
        this.shake(1800, 2);
        this.score.rumble(0.8);
        this.score.whoosh(0.15, 1.4);
        break;
      case "door":
        this.doorStart = now + 300;
        this.shake(2000, 2);
        this.score.rumble(1);
        this.score.chime();
        break;
    }
  }

  /** Dev only: jump to a room, for the screenshots. */
  debugGo(room: RoomId, x?: number, y?: number) {
    this.current = this.live.get(room)!;
    const box = interior(this.current.room);
    this.x = x ?? (box.left + box.right) / 2;
    this.y = y ?? (box.top + box.bottom) / 2;
    this.lastSafe = { x: this.x, y: this.y };
    this.intro = 0;
    this.iris = 0;
    this.slide = null;
    this.hooks.onRoom(room, this.x, this.y);
  }

  private shake(ms: number, amp: number) {
    if (this.reduce) return;
    this.shakeUntil = performance.now() + ms;
    this.shakeAmp = amp;
  }

  private resize = () => {
    const css = { w: window.innerWidth, h: window.innerHeight };
    // Device pixels, except that a 2x screen draws at 1x and doubles by the browser: the art is
    // whole cells either way and it is four times fewer pixels to fill.
    const dpr = window.devicePixelRatio || 1;
    const k = dpr >= 2 ? dpr / 2 : dpr;
    const W = Math.round(css.w * k);
    const H = Math.round(css.h * k);
    this.S = Math.max(1, Math.floor(Math.min(W / 352, H / 200)));
    this.viewW = Math.ceil(W / this.S);
    this.viewH = Math.ceil(H / this.S);
    this.R = [this.S, Math.ceil(this.S / 2), 1][this.stepsDown]!;
    this.canvas.width = this.viewW * this.R;
    this.canvas.height = this.viewH * this.R;
    this.canvas.style.width = `${(this.viewW * this.S) / k}px`;
    this.canvas.style.height = `${(this.viewH * this.S) / k}px`;
    this.dark = makeCanvas(this.viewW, this.viewH);
    this.ctx.imageSmoothingEnabled = false;
  };

  /**
   * A laptop that cannot keep up draws fewer canvas pixels per cell and lets the browser stretch
   * them. Every cell stays a whole cell, so the picture is the same; only the photo on the mural
   * gets softer. It only ever steps down, so it cannot flicker between the two.
   */
  private watchFrames(now: number) {
    const gap = now - this.lastFrame;
    this.lastFrame = now;
    if (this.paused || this.slide || gap > 250 || this.stepsDown >= 2) return;
    this.slowSum += gap;
    this.slowCount += 1;
    if (this.slowCount < 60) return;
    const slow = this.slowSum / this.slowCount > 26;
    this.slowSum = 0;
    this.slowCount = 0;
    if (slow) {
      this.stepsDown += 1;
      this.resize();
    }
  }

  private clearKeys = () => {
    this.keys.clear();
  };

  private keyDown = (event: KeyboardEvent) => {
    this.score.arm();
    if (this.paused || event.metaKey || event.ctrlKey || event.altKey) return;
    const code = event.code;
    // E and Enter too: the close-up they open takes the focus before the key's letter lands.
    if (code.startsWith("Arrow") || ["Space", "KeyE", "Enter"].includes(code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    this.keys.add(code);
    if (code === "KeyE" || code === "Enter") this.interact();
    if ((code === "Space" || code === "ShiftLeft" || code === "ShiftRight") && !this.intro)
      this.dash();
    if (code === "Backspace" && this.stamps.length && this.current.room.id === "hall") {
      this.stamps.pop();
      this.emitStamps();
      this.score.tick(600, 0.08);
    }
  };

  private keyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private emitStamps() {
    const rows = this.flags.square;
    this.hooks.onStamp(rows ? this.stamps.map(({ r, c }) => rows[r]![c]!).join("") : "");
  }

  private interact() {
    if (this.intro || this.slide || this.falling) return;
    if (this.here) {
      this.hooks.onInteract(this.here.target);
      return;
    }
    if (this.tile) {
      this.stamps.push({ r: this.tile.r, c: this.tile.c });
      this.emitStamps();
      this.score.stone();
      this.spray(this.x, this.y, C.green, 6);
    }
  }

  private dash() {
    if (this.dashRest > 0 || this.slide || this.falling) return;
    let dx = 0;
    let dy = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) dx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) dy -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dy += 1;
    if (!dx && !dy) dx = this.facing;
    const len = Math.hypot(dx, dy);
    this.dashX = dx / len;
    this.dashY = dy / len;
    this.dashLeft = DASH_TIME;
    this.dashRest = DASH_REST;
    this.score.whoosh(0.08, 0.25);
  }

  /* ---------------------------------------------------------------- building */

  private build(room: Room): Live {
    const items: Item[] = [];
    const solids: Live["solids"] = [];
    for (const prop of room.props) {
      const picture = propPicture(prop);
      const left = Math.round(prop.x - picture.width / 2);
      const top = prop.y - picture.height + 1;
      const shadowW = Math.round(picture.width * 0.9);
      items.push({
        y: prop.y,
        draw: (ctx) => {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(prop.x - Math.round(shadowW / 2), prop.y - 1, shadowW, 3);
          ctx.drawImage(picture, left, top);
        },
      });
      const solid = solidOf(prop);
      if (solid) solids.push(solid);
    }
    for (const fire of room.fires) {
      if (fire.big) {
        const solid = solidOfFire(fire);
        if (solid) solids.push(solid);
        items.push({ y: fire.y, draw: (ctx, time) => this.drawFire(ctx, fire, time) });
      }
    }
    if (room.id === "chasm") {
      items.push({ y: 108, draw: (ctx) => this.drawStele(ctx, 320, 108) });
      solids.push({ x: 298, y: 90, w: 44, h: 18 });
    }
    if (room.id === "sanctum") {
      items.push({ y: 112, draw: (ctx, time) => this.drawAltar(ctx, 160, 112, time) });
      solids.push({ x: 138, y: 96, w: 44, h: 16 });
    }
    items.sort((a, b) => a.y - b.y);
    const r = rng(room.w * 17 + room.at[0] * 5 + room.at[1] * 3 + 9);
    const box = interior(room);
    const motes = Array.from({ length: 22 }, () => ({
      x: box.left + r() * (box.right - box.left),
      y: box.top - 10 + r() * (box.bottom - box.top + 10),
      s: 2 + r() * 5,
      p: r() * 6.28,
    }));
    return { room, bg: paintRoom(room, SQUARE), items, solids, motes };
  }

  /* ---------------------------------------------------------------- the world's rules */

  private free(x: number, y: number) {
    const room = this.current.room;
    const box = interior(room);
    const { n, s, e, w } = room.doors;
    const inside = x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    if (inside) return true;
    if (n && Math.abs(x - n.at) < DOOR_HALF && y >= box.top - 16 && y <= box.top) {
      return room.id !== "hall" || !!this.flags.final;
    }
    if (s && Math.abs(x - s.at) < DOOR_HALF && y >= box.bottom && y <= box.bottom + 16) return true;
    if (w && Math.abs(y - w.at) < DOOR_HALF && x <= box.left && x >= box.left - 16) return true;
    if (e && Math.abs(y - e.at) < DOOR_HALF && x >= box.right && x <= box.right + 16) return true;
    return false;
  }

  private blocked(x: number, y: number) {
    const hw = 5;
    if (
      !this.free(x - hw, y - 4) ||
      !this.free(x + hw, y - 4) ||
      !this.free(x - hw, y) ||
      !this.free(x + hw, y)
    )
      return true;
    for (const s of this.current.solids) {
      if (x + hw > s.x && x - hw < s.x + s.w && y > s.y && y - 4 < s.y + s.h) return true;
    }
    return false;
  }

  private camera(live: Live) {
    const rw = live.room.w * TILE;
    const rh = live.room.h * TILE;
    const axis = (view: number, size: number, at: number) =>
      size <= view
        ? -Math.floor((view - size) / 2)
        : Math.round(Math.min(size - view, Math.max(0, at - view / 2)));
    const atPlayer = live === this.current;
    return {
      x: axis(this.viewW, rw, atPlayer ? this.x : rw / 2),
      y: axis(this.viewH, rh, atPlayer ? this.y : rh / 2),
    };
  }

  private setPrompt(label: string | null) {
    if (label === this.prompt) return;
    this.prompt = label;
    this.hooks.onPrompt(label);
  }

  private enter(side: Side) {
    const door = this.current.room.doors[side];
    if (!door) return;
    const from = this.current;
    const fromCam = this.camera(from);
    const to = this.live.get(door.to)!;
    const landing = arrival(to.room, OPPOSITE[side]);
    this.current = to;
    this.x = landing.x;
    this.y = landing.y;
    this.lastSafe = { ...landing };
    this.dashLeft = 0;
    this.slide = this.reduce ? null : { from, to, fromCam, t: 0, side };
    this.score.whoosh(0.05, 0.3);
    this.hooks.onRoom(to.room.id, this.x, this.y);
    this.score.fire(to.room.id === "hall" ? 0.22 : 0.08);
  }

  /** The tile of the Hall's square under the feet, if the square has spoken. */
  private tileUnderFoot() {
    const rows = this.flags.square;
    if (!rows || this.current.room.id !== "hall") return null;
    const c = Math.floor((this.x - SQUARE.x) / SQUARE.tile);
    const r = Math.floor((this.y - 2 - SQUARE.y) / SQUARE.tile);
    const letter = rows[r]?.[c];
    return letter ? { r, c, letter } : null;
  }

  private spikesUp(strip: { phase: number }, time: number) {
    const p = (time / SPIKE_PERIOD + strip.phase) % 1;
    return p < 0.55 ? 0 : p < 0.68 ? 1 : 2;
  }

  private spray(x: number, y: number, ink: string, count: number) {
    if (this.reduce) return;
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * 6.28;
      const v = 20 + Math.random() * 50;
      this.motes.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 15,
        life: 0.35 + Math.random() * 0.35,
        ink,
      });
    }
  }

  private update(dt: number, time: number) {
    if (this.iris > 0) this.iris = Math.max(0, this.iris - dt / 1.8);
    this.hurt = Math.max(0, this.hurt - dt);
    this.dashRest = Math.max(0, this.dashRest - dt);

    if (this.slide) {
      this.slide.t += dt / SLIDE;
      if (this.slide.t >= 1) this.slide = null;
      return;
    }

    if (this.falling > 0) {
      this.falling -= dt;
      if (this.falling <= 0) {
        this.falling = 0;
        const safe = this.current.room.safe ?? this.lastSafe;
        this.x = safe.x;
        this.y = safe.y;
        this.hurt = 0.8;
        this.score.stone();
      }
      return;
    }

    let dx = 0;
    let dy = 0;
    if (this.intro > 0) {
      this.intro = Math.max(0, this.intro - dt);
      dy = -0.55;
    } else {
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) dx -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dx += 1;
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) dy -= 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dy += 1;
    }
    if (dx || dy) {
      if (!this.movedOnce && this.intro <= 0) {
        this.movedOnce = true;
        this.hooks.onFirstMove();
      }
      if (dx) this.facing = dx;
      const len = Math.max(1, Math.hypot(dx, dy));
      dx /= len;
      dy /= len;
    }

    let vx = dx * SPEED;
    let vy = dy * SPEED;
    if (this.dashLeft > 0) {
      this.dashLeft -= dt;
      vx = this.dashX * DASH_SPEED;
      vy = this.dashY * DASH_SPEED;
      if (this.dashX) this.facing = Math.sign(this.dashX);
      if (!this.reduce) {
        this.ghosts.push({
          x: this.x,
          y: this.y,
          step: Math.floor(this.walked / 7) % 4,
          flip: this.facing < 0,
          life: 0.22,
        });
      }
    }

    const nx = this.x + vx * dt;
    if (!this.blocked(nx, this.y)) this.x = nx;
    const ny = this.y + vy * dt;
    if (!this.blocked(this.x, ny)) this.y = ny;

    this.moving = !!(vx || vy);
    if (this.moving) {
      this.walked += Math.hypot(vx, vy) * dt;
      if (time - this.lastStepSound > 0.27 && this.dashLeft <= 0) {
        this.lastStepSound = time;
        this.score.tick(240 + Math.random() * 90, 0.045);
        if (!this.reduce && this.motes.length < 60) {
          this.motes.push({
            x: this.x - this.facing * 3,
            y: this.y,
            vx: -this.facing * 8,
            vy: -6,
            life: 0.3,
            ink: C.s5,
          });
        }
      }
    }

    // Through a door.
    const box = interior(this.current.room);
    if (this.y < box.top - 6) this.enter("n");
    else if (this.y > box.bottom + 9) this.enter("s");
    else if (this.x < box.left - 8) this.enter("w");
    else if (this.x > box.right + 8) this.enter("e");
    if (this.slide) {
      this.setPrompt(null);
      return;
    }

    this.hazards(time);
    this.findSpot();

    // Fire throws embers.
    if (!this.reduce && this.motes.length < 70) {
      const now = this.fireNow();
      for (const fire of this.current.room.fires) {
        if (fire.i < (fire.side === "L" ? now.left : now.right) && Math.random() < dt * 1.4) {
          this.motes.push({
            x: fire.x + (Math.random() - 0.5) * 6,
            y: fire.y - (fire.big ? 20 : 10),
            vx: (Math.random() - 0.5) * 10,
            vy: -16 - Math.random() * 18,
            life: 0.7 + Math.random() * 0.8,
            ink: now.flare ? C.red : Math.random() < 0.4 ? C.mint : C.green,
          });
        }
      }
    }
  }

  private hazards(time: number) {
    const room = this.current.room;
    const box = interior(room);
    if (room.spikes && this.hurt <= 0) {
      let onStrip = false;
      for (const strip of room.spikes) {
        if (this.x + 3 > strip.x && this.x - 3 < strip.x + strip.w && this.y > box.top) {
          onStrip = true;
          if (this.spikesUp(strip, time) === 2) {
            this.x = this.lastSafe.x;
            this.y = this.lastSafe.y;
            this.hurt = 0.9;
            this.flashUntil = performance.now() + 160;
            this.shake(220, 2);
            this.score.thud();
            this.spray(this.x, this.y, C.red, 8);
          }
        }
      }
      if (!onStrip) this.lastSafe = { x: this.x, y: this.y };
    }
    if (room.floor) {
      const col = Math.floor((this.x - box.left) / TILE);
      const row = Math.floor((this.y - 2 - box.top) / TILE);
      const ch = room.floor[row]?.[col];
      if (ch === "h") {
        const id = `${col},${row}`;
        if (!this.revealed.has(id)) {
          this.revealed.add(id);
          this.score.tick(700, 0.1);
          this.spray(box.left + col * TILE + 8, box.top + row * TILE + 8, C.s6, 5);
        }
      } else if (ch === "p") {
        this.falling = FALL;
        this.dashLeft = 0;
        this.score.whoosh(0.1, 0.5);
        this.setPrompt(null);
      }
    }
  }

  private findSpot() {
    let best: Spot | null = null;
    let bestD = Infinity;
    for (const spot of this.current.room.spots) {
      if (spot.target.kind === "altar" && !this.flags.final) continue;
      if (spot.target.kind === "door" && this.flags.final) continue;
      const d = Math.hypot(this.x - spot.x, (this.y - spot.y) * 1.2);
      if (d < spot.r && d < bestD) {
        best = spot;
        bestD = d;
      }
    }
    this.here = best;
    this.tile = this.flags.final || best ? null : this.tileUnderFoot();
    if (best) this.setPrompt(labelOf(best.target, this.flags));
    else if (this.tile) {
      this.setPrompt(`Press ${this.tile.letter === "I" ? "I / J" : this.tile.letter}`);
    } else this.setPrompt(null);
  }

  /** What the fires are saying right now. */
  private fireNow() {
    let t = performance.now() % this.cycle;
    for (let i = 0; i < this.beats.length; i += 1) {
      const beat = this.beats[i]!;
      if (t < beat.ms) return { left: beat.left, right: beat.right, flare: i === 0 };
      t -= beat.ms;
    }
    return { left: 0, right: 0, flare: false };
  }

  /* ---------------------------------------------------------------- drawing */

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.asleep) {
      this.last = now;
      return;
    }
    this.watchFrames(now);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const time = now / 1000;
    if (!this.paused) this.update(dt, time);
    else if (this.slide) this.slide = null;
    this.stepMotes(dt);
    this.render(now, time);
  };

  private stepMotes(dt: number) {
    let n = 0;
    for (const m of this.motes) {
      m.life -= dt;
      if (m.life <= 0) continue;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      this.motes[n] = m;
      n += 1;
    }
    this.motes.length = n;
    let g = 0;
    for (const ghost of this.ghosts) {
      ghost.life -= dt;
      if (ghost.life <= 0) continue;
      this.ghosts[g] = ghost;
      g += 1;
    }
    this.ghosts.length = g;
  }

  private render(now: number, time: number) {
    const { ctx, R, viewW, viewH } = this;
    const flameTime = this.reduce ? 1 : time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let ox = 0;
    let oy = 0;
    if (now < this.shakeUntil) {
      ox = Math.round((Math.random() - 0.5) * 2 * this.shakeAmp);
      oy = Math.round((Math.random() - 0.5) * 2 * this.shakeAmp);
    }

    const darkCtx = this.dark.ctx;
    darkCtx.globalCompositeOperation = "source-over";
    darkCtx.clearRect(0, 0, viewW, viewH);
    const ambient = AMBIENT + (1 - AMBIENT) * Math.min(1, this.iris * 1.4);
    darkCtx.fillStyle = `rgba(2,5,4,${ambient})`;
    darkCtx.fillRect(0, 0, viewW, viewH);
    darkCtx.globalCompositeOperation = "destination-out";

    const fire = this.fireNow();
    this.tints.length = 0;
    if (this.slide) {
      const p = easeInOut(Math.min(1, this.slide.t));
      const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[this.slide.side];
      const sx = dir[0]! * viewW;
      const sy = dir[1]! * viewH;
      const cam = this.camera(this.slide.to);
      this.drawRoom(
        this.slide.from,
        Math.round(-this.slide.fromCam.x - sx * p) + ox,
        Math.round(-this.slide.fromCam.y - sy * p) + oy,
        now,
        time,
        flameTime,
        fire,
        false,
      );
      this.drawRoom(
        this.slide.to,
        Math.round(-cam.x + sx * (1 - p)) + ox,
        Math.round(-cam.y + sy * (1 - p)) + oy,
        now,
        time,
        flameTime,
        fire,
        false,
      );
    } else {
      const cam = this.camera(this.current);
      this.drawRoom(this.current, -cam.x + ox, -cam.y + oy, now, time, flameTime, fire, true);
    }

    ctx.setTransform(R, 0, 0, R, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.dark.canvas, 0, 0);

    // Firelight colours what it falls on.
    ctx.globalCompositeOperation = "lighter";
    for (const t of this.tints) {
      ctx.globalAlpha = t.flare ? 0.2 : 0.13;
      ctx.drawImage(tintPicture(t.r, t.flare), t.x - t.r, t.y - t.r);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (now < this.flashUntil) {
      ctx.fillStyle = "rgba(255,69,69,0.22)";
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  private drawRoom(
    live: Live,
    ox: number,
    oy: number,
    now: number,
    time: number,
    flameTime: number,
    fire: { left: number; right: number; flare: boolean },
    withPlayer: boolean,
  ) {
    const { ctx, R } = this;
    const room = live.room;
    ctx.setTransform(R, 0, 0, R, ox * R, oy * R);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(live.bg, 0, 0);
    this.drawFloorLife(room, time, withPlayer);
    this.drawWallLife(room, now, flameTime, fire);

    // Everything standing, back to front, the dinosaur among it.
    let drewPlayer = !withPlayer;
    for (const item of live.items) {
      if (!drewPlayer && item.y > this.y) {
        this.drawPlayer(time);
        drewPlayer = true;
      }
      item.draw(ctx, flameTime);
    }
    if (!drewPlayer) this.drawPlayer(time);

    this.drawMotes(live, time, withPlayer);
    if (withPlayer && !this.paused && this.here && !this.slide) this.drawKeycap(this.here, time);

    this.cutLights(live, ox, oy, flameTime, fire, withPlayer, now);
  }

  private drawFloorLife(room: Room, time: number, withPlayer: boolean) {
    const ctx = this.ctx;
    const box = interior(room);
    if (room.id === "hall") this.drawSquare(performance.now());
    if (room.spikes) {
      for (const strip of room.spikes) {
        const state = this.spikesUp(strip, time);
        if (state === 0) continue;
        for (let y = box.top + 3; y < box.bottom; y += 8) {
          for (let x = strip.x + 3; x < strip.x + strip.w; x += 8) {
            if (state === 1) {
              ctx.fillStyle = C.s6;
              ctx.fillRect(x + 1, y, 1, 1);
            } else {
              ctx.fillStyle = C.s6;
              ctx.fillRect(x, y - 2, 3, 3);
              ctx.fillStyle = C.s8;
              ctx.fillRect(x + 1, y - 5, 1, 4);
            }
          }
        }
      }
    }
    if (room.floor) {
      room.floor.forEach((rowText, row) =>
        [...rowText].forEach((ch, col) => {
          if (ch !== "h") return;
          const x = box.left + col * TILE;
          const y = box.top + row * TILE;
          if (this.revealed.has(`${col},${row}`)) {
            drawPathStone(ctx, x, y);
          } else if (withPlayer && Math.hypot(this.x - x - 8, this.y - y - 8) < 30) {
            // The lantern catches the edge of a stone that should not be there.
            ctx.fillStyle = C.s4;
            ctx.fillRect(x + 1, y + 1, 3, 1);
            ctx.fillRect(x + 1, y + 1, 1, 3);
            ctx.fillRect(x + 12, y + 14, 3, 1);
            ctx.fillRect(x + 14, y + 12, 1, 3);
          }
        }),
      );
    }
  }

  private drawSquare(now: number) {
    const rows = this.flags.square;
    if (!rows) return;
    const ctx = this.ctx;
    const picture = kept(`square:${rows.join("")}`, () => {
      const { canvas, ctx: c } = makeCanvas(SQUARE.tile * 5, SQUARE.tile * 5);
      rows.forEach((row, r) =>
        [...row].forEach((letter, col) => {
          const x = col * SQUARE.tile;
          const y = r * SQUARE.tile;
          drawSquareTile(c, x, y, SQUARE.tile);
          if (letter === "I") {
            drawLetter(c, "I", x + 4, y + 6, C.s8);
            drawLetter(c, "J", x + 10, y + 6, C.s6);
          } else drawLetter(c, letter, x + 8, y + 6, C.s8);
        }),
      );
      return canvas;
    });
    const t = SQUARE.tile;
    const u = this.squareStart < 0 ? 1e9 : now - this.squareStart;
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        // Tile by tile out from the middle.
        const delay = (Math.abs(r - 2) + Math.abs(c - 2)) * 130;
        const age = u - delay;
        if (age < 0) continue;
        ctx.drawImage(picture, c * t, r * t, t, t, SQUARE.x + c * t, SQUARE.y + r * t, t, t);
        if (age < 500) {
          ctx.fillStyle = `rgba(3,198,82,${0.55 * (1 - age / 500)})`;
          ctx.fillRect(SQUARE.x + c * t + 1, SQUARE.y + r * t + 1, t - 2, t - 2);
        }
      }
    }
    const pressed = new Map<string, number>();
    this.stamps.forEach(({ r, c }) => pressed.set(`${r},${c}`, 1));
    for (const id of pressed.keys()) {
      const [r, c] = id.split(",").map(Number) as [number, number];
      const x = SQUARE.x + c * t;
      const y = SQUARE.y + r * t;
      ctx.fillStyle = C.moss;
      ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
      ctx.fillStyle = C.s0;
      ctx.fillRect(x + 1, y + 1, t - 2, 2);
      const letter = rows[r]![c]!;
      if (letter === "I") {
        drawLetter(ctx, "I", x + 4, y + 7, C.mint);
        drawLetter(ctx, "J", x + 10, y + 7, C.deep);
      } else drawLetter(ctx, letter, x + 8, y + 7, C.mint);
    }
    if (this.tile) {
      const x = SQUARE.x + this.tile.c * t;
      const y = SQUARE.y + this.tile.r * t;
      ctx.fillStyle = C.green;
      ctx.fillRect(x, y, t, 1);
      ctx.fillRect(x, y + t - 1, t, 1);
      ctx.fillRect(x, y, 1, t);
      ctx.fillRect(x + t - 1, y, 1, t);
    }
  }

  private drawWallLife(
    room: Room,
    now: number,
    flameTime: number,
    fire: { left: number; right: number; flare: boolean },
  ) {
    const ctx = this.ctx;
    for (const spot of room.spots) {
      if (spot.target.kind === "tablet") this.drawTablet(spot.target.index, spot.x, now);
    }
    if (room.id === "mural") this.drawMural(now);
    if (room.id === "gate") this.drawGate(now);
    if (room.id === "hall") this.drawGreatDoor(now);
    if (room.id === "sanctum" && this.flags.final) {
      drawWord(ctx, this.flags.final, 160, 20, C.deep, 3);
      drawWord(ctx, this.flags.final, 160, 19, C.green, 3);
    }
    for (const f of room.fires) if (!f.big) this.drawFire(ctx, f, flameTime, fire);
  }

  private drawFire(ctx: CanvasRenderingContext2D, fire: Fire, time: number, now = this.fireNow()) {
    const picture = brazierPicture(!!fire.big);
    const left = fire.x - Math.floor(picture.width / 2);
    const top = fire.y - picture.height + 1;
    if (fire.big) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(fire.x - 6, fire.y - 1, 12, 3);
    }
    ctx.drawImage(picture, left, top);
    const lit = fire.i < (fire.side === "L" ? now.left : now.right);
    const seed = fire.x * 0.37 + fire.i * 2.1;
    if (lit) {
      if (fire.big) drawFlame(ctx, fire.x, top - 1, 5, 12, time, seed, now.flare);
      else drawFlame(ctx, fire.x, top - 1, 4, 12, time, seed, now.flare);
    } else {
      ctx.fillStyle = C.deep;
      ctx.fillRect(fire.x - 1, top - 1, 1, 1);
      ctx.fillRect(fire.x + 1, top - 1, 1, 1);
    }
  }

  private drawTablet(index: number, cx: number, now: number) {
    const ctx = this.ctx;
    const solved = this.flags.solved[index];
    const picture = kept(`tablet:${index}:${!!solved}`, () => {
      const { canvas, ctx: c } = makeCanvas(30, 34);
      c.fillStyle = C.s1;
      c.fillRect(2, 1, 28, 33);
      c.fillStyle = solved ? C.s5 : C.s5;
      c.fillRect(2, 2, 26, 30);
      c.fillRect(4, 0, 22, 2);
      c.fillStyle = C.s7;
      c.fillRect(4, 0, 22, 1);
      c.fillRect(2, 2, 1, 30);
      c.fillStyle = C.s3;
      c.fillRect(5, 5, 20, 24);
      drawGlyphs(c, 7, 7, 17, 4, solved ? C.green : C.s6, index * 13 + 5);
      c.fillStyle = solved ? C.green : C.s4;
      c.fillRect(7, 27, 16, 1);
      return canvas;
    });
    ctx.drawImage(picture, cx - 15, 13);
    const age = now - (this.tabletPulse.get(index) ?? -1e9);
    if (age < 900) {
      ctx.fillStyle = `rgba(0,235,136,${0.6 * (1 - age / 900)})`;
      ctx.fillRect(cx - 13, 15, 26, 30);
    }
  }

  private drawMural(now: number) {
    const ctx = this.ctx;
    const frame = kept("mural:frame", () => {
      const { canvas, ctx: c } = makeCanvas(MURAL.w, MURAL.h);
      c.fillStyle = C.s1;
      c.fillRect(0, 0, MURAL.w, MURAL.h);
      c.fillStyle = C.s5;
      c.fillRect(1, 1, MURAL.w - 2, MURAL.h - 2);
      c.fillStyle = C.s7;
      c.fillRect(1, 1, MURAL.w - 2, 1);
      c.fillRect(1, 1, 1, MURAL.h - 2);
      c.fillStyle = C.s4;
      for (let x = 3; x < MURAL.w - 4; x += 6) {
        c.fillRect(x, 3, 4, 1);
        c.fillRect(x, 3, 1, 4);
        c.fillRect(x + 2, 5, 1, 2);
        c.fillRect(x, MURAL.h - 4, 4, 1);
        c.fillRect(x, MURAL.h - 7, 1, 4);
      }
      return canvas;
    });
    const relief = kept("mural:relief", () => {
      const { canvas, ctx: c } = makeCanvas(MURAL.iw, MURAL.ih);
      c.fillStyle = C.s3;
      c.fillRect(0, 0, MURAL.iw, MURAL.ih);
      const r = rng(5);
      for (let i = 0; i < 300; i += 1) {
        c.fillStyle = r() < 0.5 ? "#26251f" : "#33322c";
        c.fillRect(Math.floor(r() * MURAL.iw), Math.floor(r() * MURAL.ih), 1, 1);
      }
      // A line of figures with no faces.
      for (let i = 0; i < 7; i += 1) {
        const cx = 11 + i * 18;
        const base = i % 2 ? 66 : 70;
        const head = base - 42;
        c.fillStyle = C.s5;
        c.fillRect(cx - 5, head + 1, 11, 11);
        c.fillRect(cx - 4, head, 9, 13);
        c.fillRect(cx - 2, head + 13, 5, 3);
        c.fillRect(cx - 8, head + 16, 17, base - head - 16 + 6);
        c.fillRect(cx - 6, head + 15, 13, 2);
        c.fillStyle = C.s6;
        c.fillRect(cx - 4, head, 9, 1);
        c.fillRect(cx - 8, head + 16, 1, base - head - 10);
        c.fillStyle = C.s3;
        c.fillRect(cx - 3, head + 3, 7, 8);
      }
      return canvas;
    });
    ctx.drawImage(frame, MURAL.x, MURAL.y);
    const photo = this.flags.photo;
    if (!photo) {
      ctx.drawImage(relief, MURAL.ix, MURAL.iy);
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(photo, MURAL.ix, MURAL.iy, MURAL.iw, MURAL.ih);
    ctx.imageSmoothingEnabled = false;
    const u = this.muralStart < 0 ? 1e9 : now - this.muralStart;
    if (u < 1800) {
      // The relief falls away cell by cell.
      const cell = 8;
      for (let y = 0; y < MURAL.ih; y += cell) {
        for (let x = 0; x < MURAL.iw; x += cell) {
          const order = ((x * 7919 + y * 104729) % 97) / 97;
          if (u < order * 1600) {
            ctx.drawImage(relief, x, y, cell, cell, MURAL.ix + x, MURAL.iy + y, cell, cell);
          } else if (u < order * 1600 + 200) {
            ctx.fillStyle = C.mint;
            ctx.fillRect(MURAL.ix + x, MURAL.iy + y, cell, cell);
          }
        }
      }
    }
  }

  private drawGate(now: number) {
    const ctx = this.ctx;
    const word = this.flags.word;
    const picture = kept(`gate:${word ? "open" : "shut"}`, () => {
      const { canvas, ctx: c } = makeCanvas(GATE.w, GATE.h);
      c.fillStyle = C.s1;
      c.fillRect(0, 0, GATE.w, GATE.h);
      // Posts and lintel.
      c.fillStyle = C.s5;
      c.fillRect(1, 1, 12, GATE.h - 1);
      c.fillRect(GATE.w - 13, 1, 12, GATE.h - 1);
      c.fillRect(1, 1, GATE.w - 2, 20);
      c.fillStyle = C.s7;
      c.fillRect(1, 1, GATE.w - 2, 1);
      c.fillRect(1, 1, 1, GATE.h - 1);
      c.fillStyle = C.s4;
      c.fillRect(12, 21, 1, GATE.h - 21);
      c.fillRect(GATE.w - 13, 21, 1, GATE.h - 21);
      c.fillRect(1, 20, GATE.w - 2, 1);
      // The leaves.
      for (const x of [14, GATE.w / 2 + 1]) {
        c.fillStyle = C.s3;
        c.fillRect(x, 22, GATE.w / 2 - 15, GATE.h - 22);
        c.fillStyle = C.s4;
        c.fillRect(x + 2, 25, GATE.w / 2 - 19, 1);
        c.fillRect(x + 2, 25, 1, GATE.h - 28);
        c.fillStyle = C.s2;
        c.fillRect(x + 5, 29, GATE.w / 2 - 25, GATE.h - 36);
        drawGlyphs(c, x + 7, 31, GATE.w / 2 - 29, 6, word ? C.deep : C.s4, x);
      }
      c.fillStyle = C.void;
      c.fillRect(GATE.w / 2, 22, 1, GATE.h - 22);
      return canvas;
    });
    ctx.drawImage(picture, GATE.x, GATE.y);
    // Five sockets in the lintel, a stone in each riddle answered.
    const solved = this.flags.solved;
    for (let i = 0; i < 5; i += 1) {
      const x = GATE.x + 16 + i * 14;
      const y = GATE.y + 6;
      ctx.fillStyle = C.void;
      ctx.fillRect(x, y, 8, 9);
      if (solved[i]) {
        ctx.fillStyle = C.green;
        ctx.fillRect(x + 1, y + 1, 6, 7);
        ctx.fillStyle = C.mint;
        ctx.fillRect(x + 2, y + 2, 2, 2);
      }
    }
    if (word) {
      const age = now - this.wordPulse;
      // The word comes up over the sockets, on the leaves.
      ctx.fillStyle = C.s0;
      ctx.fillRect(GATE.x + 26, GATE.y + 42, 44, 15);
      drawWord(ctx, word, GATE.x + GATE.w / 2, GATE.y + 46, age < 900 ? C.white : C.green);
    }
  }

  private doorLeaves(broken: boolean) {
    return kept(`door:${broken}`, () => {
      const { canvas, ctx: c } = makeCanvas(GREAT_DOOR.w - 16, GREAT_DOOR.h - 8);
      const W = canvas.width;
      const H = canvas.height;
      c.fillStyle = C.s3;
      c.fillRect(0, 0, W, H);
      for (const x of [0, W / 2]) {
        c.fillStyle = C.s4;
        c.fillRect(x + 2, 2, W / 2 - 4, 1);
        c.fillRect(x + 2, 2, 1, H - 4);
        c.fillStyle = C.s2;
        c.fillRect(x + 4, 5, W / 2 - 8, H - 10);
        c.fillStyle = C.s4;
        for (let y = 8; y < H - 8; y += 7) c.fillRect(x + 6, y, W / 2 - 12, 1);
      }
      c.fillStyle = C.void;
      c.fillRect(W / 2 - 1, 0, 2, H);
      // The wax, across the join.
      const inks: Record<string, string> = {
        o: broken ? C.deep : C.green,
        d: broken ? C.moss : C.deep,
        s: broken ? C.moss : C.deep,
        w: broken ? C.green : C.mint,
      };
      const sx = W / 2 - 10;
      const sy = Math.floor(H / 2 - 10);
      SEAL.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (ch === ".") return;
          const crack = CRACK[y]!;
          if (broken && x === crack) return;
          c.fillStyle = inks[ch]!;
          c.fillRect(sx + x + (broken ? (x < crack ? -1 : 1) : 0), sy + y, 1, 1);
        }),
      );
      return canvas;
    });
  }

  private drawGreatDoor(now: number) {
    const ctx = this.ctx;
    const d = GREAT_DOOR;
    const frame = kept("door:frame", () => {
      const { canvas, ctx: c } = makeCanvas(d.w, d.h);
      c.fillStyle = C.s1;
      c.fillRect(0, 0, d.w, d.h);
      c.fillStyle = C.s6;
      c.fillRect(1, 1, 7, d.h - 1);
      c.fillRect(d.w - 8, 1, 7, d.h - 1);
      c.fillRect(1, 1, d.w - 2, 7);
      c.fillStyle = C.s7;
      c.fillRect(1, 1, d.w - 2, 1);
      c.fillRect(1, 1, 1, d.h - 1);
      c.fillStyle = C.deep;
      for (let x = 11; x < d.w - 12; x += 6) {
        c.fillRect(x, 3, 4, 1);
        c.fillRect(x, 3, 1, 3);
        c.fillRect(x + 2, 5, 3, 1);
      }
      return canvas;
    });
    ctx.drawImage(frame, d.x, d.y);
    const leaves = this.doorLeaves(!!this.flags.square);
    const W = leaves.width;
    const H = leaves.height;
    const ix = d.x + 8;
    const iy = d.y + 8;
    const u = this.flags.final
      ? this.doorStart < 0
        ? 1
        : Math.min(1, Math.max(0, (now - this.doorStart) / 2200))
      : 0;
    if (u <= 0) {
      ctx.drawImage(leaves, ix, iy);
      return;
    }
    // Open: stairs going up into the dark, green light at their head, the leaves drawn apart.
    ctx.fillStyle = C.void;
    ctx.fillRect(ix, iy, W, H);
    const stairs = [C.s4, C.s3, C.s3, C.s2, C.s2, C.s1, C.s1];
    stairs.forEach((ink, i) => {
      const inset = 2 + i * 3;
      const y = iy + H - 6 - i * 5;
      ctx.fillStyle = ink;
      ctx.fillRect(ix + inset, y, W - inset * 2, 4);
      ctx.fillStyle = C.s0;
      ctx.fillRect(ix + inset, y + 4, W - inset * 2, 1);
    });
    ctx.fillStyle = C.deep;
    ctx.fillRect(ix + W / 2 - 5, iy + H - 44, 10, 3);
    ctx.fillStyle = C.green;
    ctx.fillRect(ix + W / 2 - 2, iy + H - 44, 4, 3);
    const slide = Math.round(u * (W / 2));
    const left = W / 2 - slide;
    if (left > 0) {
      ctx.drawImage(leaves, slide, 0, left, H, ix, iy, left, H);
      ctx.drawImage(leaves, W / 2, 0, left, H, ix + W / 2 + slide, iy, left, H);
    }
  }

  private drawStele(ctx: CanvasRenderingContext2D, cx: number, foot: number) {
    const { carved, stoneRead } = this.flags;
    const key = `stele:${carved}:${stoneRead}`;
    const picture = kept(key, () => {
      const W = 44;
      const H = 66;
      const { canvas, ctx: c } = makeCanvas(W, H);
      c.fillStyle = C.s4;
      c.fillRect(6, 4, 32, 50);
      c.fillRect(8, 2, 28, 2);
      c.fillRect(11, 0, 22, 2);
      c.fillStyle = C.s6;
      c.fillRect(6, 4, 1, 50);
      c.fillRect(8, 2, 3, 2);
      c.fillRect(11, 0, 22, 1);
      c.fillStyle = C.s3;
      c.fillRect(35, 4, 3, 50);
      c.fillStyle = C.s2;
      c.fillRect(10, 9, 24, 34);
      if (carved) drawGlyphs(c, 12, 11, 20, 6, stoneRead ? C.green : C.s7, 3);
      // Five wheels at its foot.
      for (let i = 0; i < 5; i += 1) {
        const x = 2 + i * 8 + 1;
        c.fillStyle = C.s6;
        c.fillRect(x, 46, 7, 10);
        c.fillStyle = C.s4;
        c.fillRect(x, 48, 7, 1);
        c.fillRect(x, 51, 7, 1);
        c.fillRect(x, 54, 7, 1);
        c.fillStyle = stoneRead ? C.green : C.s8;
        c.fillRect(x + 3, 49, 1, 2);
      }
      c.fillStyle = C.s5;
      c.fillRect(0, 56, W, 4);
      c.fillStyle = C.s7;
      c.fillRect(0, 56, W, 1);
      c.fillStyle = C.s3;
      c.fillRect(0, 60, W, 6);
      c.fillStyle = C.s4;
      c.fillRect(1, 60, W - 2, 1);
      return canvas;
    });
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(cx - 22, foot - 1, 44, 3);
    ctx.drawImage(picture, cx - 22, foot - picture.height + 1);
    const age = performance.now() - this.stonePulse;
    if (age < 1400) {
      ctx.fillStyle = `rgba(0,235,136,${0.5 * (1 - age / 1400)})`;
      ctx.fillRect(cx - 12, foot - 56, 24, 34);
    }
  }

  private drawAltar(ctx: CanvasRenderingContext2D, cx: number, foot: number, time: number) {
    const picture = kept("altar", () => {
      const { canvas, ctx: c } = makeCanvas(44, 26);
      c.fillStyle = C.s7;
      c.fillRect(0, 0, 44, 3);
      c.fillStyle = C.s5;
      c.fillRect(3, 3, 38, 18);
      c.fillStyle = C.s4;
      c.fillRect(28, 3, 13, 18);
      c.fillStyle = C.deep;
      for (let x = 6; x < 36; x += 6) {
        c.fillRect(x, 8, 4, 1);
        c.fillRect(x, 8, 1, 6);
        c.fillRect(x, 14, 5, 1);
        c.fillRect(x + 2, 11, 1, 2);
      }
      c.fillStyle = C.s6;
      c.fillRect(0, 21, 44, 5);
      return canvas;
    });
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(cx - 22, foot - 1, 44, 3);
    ctx.drawImage(picture, cx - 22, foot - 25);
    if (this.flags.final) drawFlame(ctx, cx, foot - 26, 7, 20, time, 3, false);
  }

  private drawPlayer(time: number) {
    const ctx = this.ctx;
    const steps = Math.floor(this.walked / 9) % 4;
    const step = this.moving ? steps : 0;
    const bob = this.moving && !this.reduce && step % 2 === 1 ? -1 : 0;
    const blink = !this.reduce && time % 4 < 0.12;
    const flip = this.facing < 0;
    const footX = flip ? 24 - 1 - DINO_FOOT_X : DINO_FOOT_X;
    for (const ghost of this.ghosts) {
      ctx.globalAlpha = (ghost.life / 0.22) * 0.45;
      ctx.drawImage(
        dinoFrame(ghost.step, false, ghost.flip, C.deep),
        Math.round(ghost.x) - (ghost.flip ? 24 - 1 - DINO_FOOT_X : DINO_FOOT_X),
        Math.round(ghost.y) - DINO_H + 1,
      );
    }
    ctx.globalAlpha = 1;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    if (this.falling > 0) {
      // Down into the dark, whole cells at a time.
      const u = 1 - this.falling / FALL;
      const drop = Math.round(u * u * 40);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px - 20, py - DINO_H - 2, 40, DINO_H + 4);
      ctx.clip();
      ctx.drawImage(dinoFrame(0, false, flip), px - footX, py - DINO_H + 1 + drop);
      ctx.restore();
      return;
    }
    if (this.hurt > 0 && !this.reduce && Math.floor(this.hurt * 12) % 2 === 0) return;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(px - 8, py - 1, 16, 3);
    ctx.drawImage(dinoFrame(step, blink, flip), px - footX, py - DINO_H + 1 + bob);
  }

  private drawMotes(live: Live, time: number, withPlayer: boolean) {
    const ctx = this.ctx;
    if (!this.reduce) {
      ctx.fillStyle = "rgba(190,200,190,0.28)";
      for (const m of live.motes) {
        const x = Math.round(m.x + Math.sin(time * 0.25 + m.p) * m.s * 3);
        const y = Math.round(m.y + Math.cos(time * 0.18 + m.p) * m.s * 2);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    if (!withPlayer) return;
    for (const m of this.motes) {
      ctx.fillStyle = m.ink;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
    }
  }

  private drawKeycap(spot: Spot, time: number) {
    const ctx = this.ctx;
    const bob = !this.reduce && Math.floor(time * 2) % 2 ? 1 : 0;
    const cap = kept("keycap", () =>
      fromRows(
        [
          ".#########.",
          "###########",
          "###.....###",
          "###.#######",
          "###...#####",
          "###.#######",
          "###.....###",
          "###########",
          ".#########.",
          ".---------.",
        ],
        { "#": C.s8, "-": C.s5 },
      ),
    );
    ctx.drawImage(cap, spot.x - 5, spot.capY + bob);
  }

  private cutLights(
    live: Live,
    ox: number,
    oy: number,
    flameTime: number,
    fire: { left: number; right: number; flare: boolean },
    withPlayer: boolean,
    now: number,
  ) {
    const dark = this.dark.ctx;
    const pool = (x: number, y: number, radius: number) => {
      const r = Math.round(radius / 4) * 4;
      dark.drawImage(lightPicture(r), Math.round(x + ox - r), Math.round(y + oy - r));
    };
    const room = live.room;
    const flicker = (seed: number) =>
      this.reduce ? 0 : Math.sin(flameTime * 8 + seed) * 2 + Math.sin(flameTime * 13.7 + seed) * 2;
    for (const f of room.fires) {
      const lit = f.i < (f.side === "L" ? fire.left : fire.right);
      const seed = f.x * 0.37 + f.i * 2.1;
      const high = f.big ? f.y - 18 : f.y - 8;
      if (lit) {
        const radius = (f.big ? 76 : 64) + flicker(seed);
        pool(f.x, high, radius);
        this.tints.push({
          x: Math.round(f.x + ox),
          y: Math.round(high + oy),
          r: Math.round(radius / 4) * 4,
          flare: fire.flare,
        });
      } else pool(f.x, high, 12);
    }
    if (room.id === "mural" && this.flags.photo) pool(176, 48, 112);
    else if (room.id === "mural") pool(176, 60, 76);
    if (room.id === "gate") {
      pool(176, 60, this.flags.word ? 112 : 56 + 6 * this.flags.solved.filter(Boolean).length);
    }
    if (room.id === "hall") {
      pool(192, 36, 52);
      if (this.flags.square) pool(192, 128, 84);
      if (this.flags.final) pool(192, 44, 96);
    }
    if (room.id === "chasm") pool(320, 76, this.flags.stoneRead ? 84 : 44);
    if (room.id === "sanctum") {
      pool(160, 90, 150);
      pool(160, 30, 110);
    }
    for (const spot of room.spots) {
      if (spot.target.kind === "tablet") {
        pool(spot.x, 34, this.flags.solved[spot.target.index] ? 40 : 28);
      }
    }
    if (withPlayer && !this.slide) {
      const radius = this.iris > 0 ? 84 * (1 - this.iris) + 8 : 84;
      pool(this.x, this.y - 10, radius);
    } else if (this.slide && live === this.slide.to) {
      pool(this.x, this.y - 10, 84);
    }
    void now;
  }
}

function sameTarget(a: Target, b: Target) {
  return (
    a.kind === b.kind &&
    (a.kind !== "tablet" || a.index === (b as { index: number }).index) &&
    (a.kind !== "note" || a.text === (b as { text: string }).text)
  );
}

function easeInOut(u: number) {
  return u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
}

export { ROOMS };
