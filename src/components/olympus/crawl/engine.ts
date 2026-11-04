import { CRACK, SEAL } from "@/components/olympus/journey/Seal";
import {
  brazierPicture,
  BRONZE,
  C,
  cabinetPicture,
  cosmeticPicture,
  dinoFrame,
  DINO_FOOT_X,
  DINO_H,
  DINO_W,
  drawFlame,
  drawGlyphs,
  drawGreek,
  drawLetter,
  drawLiftMark,
  drawRestartMark,
  drawPathStone,
  drawSquareTile,
  drawWord,
  fromRows,
  gearPicture,
  kept,
  lightPicture,
  makeCanvas,
  maskPicture,
  miniDino,
  MIRROR,
  MIRROR_GLASS,
  mirrorPicture,
  paintRoom,
  PATINA,
  propPicture,
  rng,
  sarcophagusPicture,
  THEMES,
  tintPicture,
  wagonPicture,
  warePicture,
  type Theme,
} from "@/components/olympus/crawl/art";
import { cosmeticById, FOR_SALE, type Look } from "@/components/olympus/crawl/cosmetics";
import type { TombSound } from "@/components/olympus/crawl/sound";
import {
  FLOOR_STONES,
  OPPOSITE,
  ware,
  ROOM_LIST,
  ROOMS,
  SQUARE,
  solidOf,
  solidOfFire,
  TILE,
  type Door,
  type Fire,
  type FloorStone,
  type Room,
  type RoomId,
  type Side,
  type Spikes,
  type Spot,
  type Target,
} from "@/components/olympus/crawl/world";

/**
 * The tomb's game loop: one canvas drawn with `fillRect` and small pictures at a whole number of
 * pixels per cell, so everything stays on its grid. Rooms are painted once; each frame draws the
 * room, what moves, then a small dark layer with pools of light cut out of it (dithered, no blur).
 * Rooms really touch on the map, so going through a door is the camera panning from one to the next
 * while the dinosaur walks through. Nothing here touches React: the shell (Crawl.tsx) hears about
 * prompts, rooms and interactions through `Hooks` and says what has changed through `setFlags`.
 */

export type Flags = {
  /** The photo has been taken: the first room's door opens. */
  pictured: boolean;
  photo: HTMLImageElement | null;
  solved: boolean[];
  word: string | null;
  carved: boolean;
  stoneRead: boolean;
  /** The square's five rows, once the seal is broken. */
  square: string[] | null;
  final: string | null;
  look: Look;
  owned: string[];
};

export type Hooks = {
  onPrompt: (label: string | null) => void;
  onInteract: (target: Target) => void;
  onRoom: (room: RoomId, x: number, y: number) => void;
  onStamp: (letters: string) => void;
  onFirstMove: () => void;
  /** The fall in through the roof is over. */
  onLanded: () => void;
  /** A moment has taken the camera, or let it go. */
  onCine: (on: boolean) => void;
  /** Where the dinosaur is on the whole map. */
  onPlace: (x: number, y: number) => void;
};

export type WorldEvent =
  | { kind: "mural" }
  | { kind: "tablet"; index: number }
  | { kind: "word" }
  | { kind: "stone" }
  | { kind: "square" }
  | { kind: "door" };

const SPEED = 104;
const SLIDE = 0.62;
const FALL = 0.6;
const DROP = 0.8;
const SPIKE_PERIOD = 2.6;
/** The fires' clock, in milliseconds. */
const BEAT = { FLASH: 240, FLASH_GAP: 180, AFTER_FLARE: 1400, LIT: 2000, DARK: 700, END: 3200 };

type Beat = { left: number; right: number; ms: number; flare?: boolean };

/**
 * The signal, from the top: every fire flashes red three times, quickly, so the restart can never be
 * taken for a letter (5 and 5 being a letter too); under reduced motion it is one steady red. Then
 * each letter, held in green.
 */
function beatsOf(signal: readonly [number, number][], reduce: boolean): Beat[] {
  const flashes: Beat[] = reduce
    ? [{ left: 5, right: 5, ms: 900, flare: true }]
    : [0, 1, 2].flatMap(() => [
        { left: 5, right: 5, ms: BEAT.FLASH, flare: true },
        { left: 0, right: 0, ms: BEAT.FLASH_GAP },
      ]);
  return [
    ...flashes,
    { left: 0, right: 0, ms: BEAT.AFTER_FLARE },
    ...signal.flatMap(([left, right]) => [
      { left, right, ms: BEAT.LIT },
      { left: 0, right: 0, ms: BEAT.DARK },
    ]),
    { left: 0, right: 0, ms: BEAT.END },
  ];
}

/** How much fire the room's sound should crackle with. */
const fireIn = (room: Room) => (room.id === "hall" ? 0.22 : room.fires.length ? 0.08 : 0);

type FireNow = { left: number; right: number; flare: boolean };
type Mote = { x: number; y: number; vx: number; vy: number; life: number; ink: string };
type Item = { y: number; draw: (ctx: CanvasRenderingContext2D, time: number) => void };
type Live = {
  room: Room;
  bg: HTMLCanvasElement;
  items: Item[];
  solids: { x: number; y: number; w: number; h: number }[];
  motes: { x: number; y: number; s: number; p: number }[];
};
/** A held shot, centred on (x, y); `beside` is the room to draw past the edge of this one. */
type Cine = { x: number; y: number; ms: number; beside?: RoomId; start?: () => void };

const MURAL = { x: 120, y: 4, w: 144, h: 88, ix: 128, iy: 12, iw: 128, ih: 72 };
const MASK = { x: 156, y: 2, w: 72, h: 78 };
const SHUT = { top: 0.62, bottom: 0.68, half: 0.3 };
const OPEN = { top: 0.54, bottom: 0.9, half: 0.48 };
const GREAT_DOOR = { x: 152, y: 2, w: 80, h: 62 };
const MECHANISM = { x: 192, foot: 146 };

const mirrorX = (spot: Spot) => spot.x;
const WAGON = { x: 228, foot: 100 };
/** Lamps hung in the merchant's camp. */
const LANTERNS = [
  { x: 56, y: 36 },
  { x: 120, y: 32 },
  { x: 208, y: 30 },
];
/** Where a mirror leans, its foot on the floor at the wall. */
const MIRRORS: Partial<Record<RoomId, { x: number; foot: number }>> = {
  mural: { x: 58, foot: 100 },
  shop: { x: 90, foot: 68 },
};
const CABINETS = { arcade: { x: 72, foot: 66 }, blackjack: { x: 152, foot: 66 } };
/** The only light in the den, apart from the machines. */
const CANDLES = [
  { x: 28, y: 60 },
  { x: 112, y: 58 },
  { x: 194, y: 58 },
  { x: 30, y: 134 },
  { x: 170, y: 136 },
];

/** Where the camera closes in on each thing, in room pixels. */
function focusOf(target: Target, spot: Spot): { x: number; y: number } {
  switch (target.kind) {
    case "tablet":
      return { x: spot.x, y: spot.ty != null ? spot.ty + 16 : spot.y - 20 };
    case "mural":
      return { x: MURAL.ix + MURAL.iw / 2, y: MURAL.iy + MURAL.ih / 2 };
    case "gate":
      return { x: MASK.x + MASK.w / 2, y: 44 };
    case "stone":
      return { x: MECHANISM.x, y: 120 };
    case "door":
      return { x: 192, y: 34 };
    case "mirror":
      return { x: mirrorX(spot), y: 36 };
    case "arcade":
    case "blackjack":
      return { x: spot.x, y: 40 };
    default:
      return { x: spot.x, y: spot.y };
  }
}

export function labelOf(spot: Spot, flags: Flags): string {
  if (spot.label) return spot.label;
  switch (spot.target.kind) {
    case "tablet":
      return "Read the wall";
    case "mural":
      return flags.pictured ? "Look" : "Stand before the wall";
    case "gate":
      return "Face the mask";
    case "stone":
      return "Turn the wheels";
    case "door":
      return flags.square ? "Speak" : "Touch the seal";
    case "altar":
      return "Take the word";
    case "note":
      return "Look";
    case "mirror":
      return "Look in the mirror";
    case "arcade":
    case "blackjack":
      return "Play";
    case "item": {
      const item = cosmeticById(spot.target.id);
      return item ? `Buy ${item.name}` : "Buy";
    }
  }
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);

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
  private hurt = 0;
  private lastSafe: { x: number; y: number };
  private motes: Mote[] = [];
  private movedOnce = false;
  private paused = false;
  /** Behind the camera: the world still burns, at a few frames a second. */
  private asleep = false;
  private lastDraw = 0;
  /** Where the dinosaur walks to, out of the way of a close-up that uses the room. */
  private aside: number | null = null;
  private cssCell = 3;
  /** Where the room being drawn sits, for the things drawn after the dark. */
  private litAt: { live: Live; ox: number; oy: number } | null = null;
  private litLayer = makeCanvas(96, 96);
  /** The fall in through the roof, the first time. */
  private drop = 0;
  private iris = 1;
  private slide: {
    from: Live;
    to: Live;
    camFrom: { x: number; y: number };
    camTo: { x: number; y: number };
    sx: number;
    sy: number;
    ex: number;
    ey: number;
    t: number;
  } | null = null;
  private falling = 0;
  private revealed = new Set<string>();
  private shakeUntil = 0;
  private shakeAmp = 0;
  private flashUntil = 0;
  private prompt: string | null = null;
  private here: Spot | null = null;
  private tile: { r: number; c: number; letter: string } | null = null;
  private stone: FloorStone | null = null;
  private stamps: { r: number; c: number }[] = [];
  private flags: Flags;
  private muralStart = -1;
  private slabStart = -1;
  private squareStart = -1;
  private doorStart = -1;
  private tabletPulse = new Map<number, number>();
  private wordPulse = -1;
  private stonePulse = -1;
  private cine: Cine[] = [];
  private cineLeft = 0;
  /** When the fires last began their signal: the restart stone moves this. */
  private fireStart = 0;
  private beside: Live | null = null;
  /** The middle of the shot while something has taken the camera off the dinosaur. */
  private look = { x: 0, y: 0 };
  private lookTarget: { x: number; y: number } | null = null;
  private lookAway = false;
  private lastPlace = "";
  private reduce: boolean;
  private tints: { x: number; y: number; r: number; ink: string; alpha: number }[] = [];

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
    this.beats = beatsOf(signal, reduce);
    this.cycle = this.beats.reduce((sum, b) => sum + b.ms, 0);
    this.flags = flags;
    this.reduce = reduce;
    for (const room of ROOM_LIST) this.live.set(room.id, this.build(room));
    const known = start && ROOMS[start.room] ? start : null;
    this.current = this.live.get(known?.room ?? "mural")!;
    this.score.fire(fireIn(this.current.room));
    this.x = known?.x ?? 192;
    this.y = known?.y ?? 154;
    this.drop = known || reduce ? 0 : DROP;
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

  /** The world stops for a close-up; `sleep` also draws it slowly (the camera's busy then). */
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
    return this.onScreen(at.x, at.y);
  }

  /** The mural wakes: the camera settles square on it and the dinosaur steps out of the way. */
  faceMural() {
    this.takeCamera({ ...this.framed(MURAL.ix + MURAL.iw / 2, 104) });
    this.aside = 132;
  }

  /** The middle of the shot that shows (x, y) from inside the room, as the camera normally would. */
  private framed(x: number, y: number) {
    const cam = this.cameraAt(this.current, x, y);
    return { x: cam.x + this.viewW / 2, y: cam.y + this.viewH / 2 };
  }

  private takeCamera(target: { x: number; y: number }) {
    if (!this.lookAway) this.look = this.framed(this.x, this.y);
    this.lookAway = true;
    this.lookTarget = target;
  }

  /** The camera goes back to following the dinosaur. */
  releaseLook() {
    this.lookTarget = null;
    this.aside = null;
    this.moving = false;
  }

  private stepAside(dt: number) {
    if (this.aside === null) return;
    const d = this.aside - this.x;
    if (Math.abs(d) < 1.5) {
      this.moving = false;
      return;
    }
    this.moving = true;
    this.facing = Math.sign(d);
    const step = SPEED * dt;
    this.x += Math.sign(d) * Math.min(step, Math.abs(d));
    this.walked += step;
  }

  /** The mural's picture on screen once the camera has settled, in CSS pixels; its stone's width. */
  muralRect() {
    const at = this.lookTarget ?? { x: this.x, y: this.y };
    const cam = this.cameraAt(this.current, at.x, at.y);
    const c = this.cssCell;
    return {
      x: (MURAL.ix - cam.x) * c,
      y: (MURAL.iy - cam.y) * c,
      w: MURAL.iw * c,
      h: MURAL.ih * c,
      stone: (MURAL.iy - MURAL.y) * c,
    };
  }

  private onScreen(x: number, y: number) {
    const cam = this.camera(this.current);
    return { x: (x - cam.x) / this.viewW, y: (y - cam.y) / this.viewH };
  }

  /** Forget the pressed letters: the fires said otherwise, or the word was spoken. */
  clearStamps() {
    this.stamps = [];
    this.hooks.onStamp("");
  }

  /** Something in the world has just changed: show it, and hold on the big ones. */
  play(event: WorldEvent) {
    const now = performance.now();
    switch (event.kind) {
      case "mural":
        this.muralStart = now;
        this.slabStart = now + 1900;
        this.score.fanfare();
        this.playCine([
          { x: MURAL.x + MURAL.w / 2, y: MURAL.y + MURAL.h / 2, ms: 1700 },
          {
            x: 376,
            y: 160,
            ms: 2400,
            beside: "hall",
            start: () => {
              this.shake(1400, 2);
              this.score.rumble(0.8);
              for (let i = 0; i < 4; i += 1) this.spray(372, 150 + i * 7, THEMES.sand.s7, 6);
            },
          },
        ]);
        break;
      case "tablet":
        this.tabletPulse.set(event.index, now);
        this.score.solved();
        break;
      case "word":
        this.wordPulse = now + 300;
        this.shake(900, 2);
        this.score.rumble(0.6);
        this.score.secret();
        this.playCine([{ x: MASK.x + MASK.w / 2, y: MASK.y + MASK.h / 2, ms: 2400 }]);
        break;
      case "stone":
        this.stonePulse = now;
        this.score.secret();
        this.playCine([{ x: MECHANISM.x, y: MECHANISM.foot - 29, ms: 2000 }]);
        break;
      case "square":
        this.squareStart = now + 500;
        this.shake(1800, 2);
        this.score.rumble(0.8);
        this.score.whoosh(0.15, 1.4);
        this.score.secret();
        this.playCine([
          { x: SQUARE.x + SQUARE.tile * 2.5, y: SQUARE.y + SQUARE.tile * 2.5, ms: 2800 },
        ]);
        break;
      case "door":
        this.doorStart = now + 500;
        this.shake(2000, 2);
        this.score.rumble(1);
        this.score.fanfare();
        this.playCine([
          { x: GREAT_DOOR.x + GREAT_DOOR.w / 2, y: GREAT_DOOR.y + GREAT_DOOR.h / 2, ms: 3000 },
        ]);
        break;
    }
  }

  private playCine(beats: Cine[]) {
    if (this.reduce) {
      beats.forEach((b) => b.start?.());
      return;
    }
    this.cine = beats;
    this.cineLeft = 0;
    this.nextCine();
  }

  private nextCine() {
    const beat = this.cine.shift();
    if (!beat) {
      this.cineLeft = 0;
      this.lookTarget = null;
      this.beside = null;
      this.hooks.onCine(false);
      return;
    }
    this.cineLeft = beat.ms / 1000;
    beat.start?.();
    // Not pulled in from the room's edges, as the camera normally is: the subject goes dead centre,
    // the one place the bars and the zoom can never cut it.
    this.takeCamera({ x: beat.x, y: beat.y });
    this.beside = beat.beside ? this.live.get(beat.beside)! : null;
    this.hooks.onCine(true);
  }

  /** Dev only: jump to a room, for the screenshots. */
  debugGo(room: RoomId, x?: number, y?: number) {
    this.current = this.live.get(room)!;
    const landing = Object.values(this.current.room.doors)[0]?.landing ?? { x: 100, y: 100 };
    this.x = x ?? landing.x;
    this.y = y ?? landing.y;
    this.lastSafe = { x: this.x, y: this.y };
    this.drop = 0;
    this.iris = 0;
    this.slide = null;
    this.lookAway = false;
    this.lookTarget = null;
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
    this.cssCell = this.S / k;
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
    if (code.startsWith("Arrow") || ["KeyE", "Enter"].includes(code)) event.preventDefault();
    if (event.repeat) return;
    this.keys.add(code);
    if (code === "KeyE" || code === "Enter") this.interact();
    if (code === "Backspace" && this.stamps.length && this.current.room.id === "hall") {
      this.liftLetter();
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
    if (this.drop > 0 || this.slide || this.falling || this.cineLeft > 0) return;
    if (this.here) {
      this.hooks.onInteract(this.here.target);
      return;
    }
    if (this.tile) {
      this.stamps.push({ r: this.tile.r, c: this.tile.c });
      this.emitStamps();
      this.score.press(this.stamps.length);
      this.spray(this.x, this.y, C.green, 6);
      return;
    }
    if (this.stone === "restart") {
      this.fireStart = performance.now();
      this.score.whoosh(0.1, 0.5);
      this.score.tick(180, 0.12);
      this.spray(this.x, this.y, C.mint, 8);
    } else if (this.stone === "lift" && this.stamps.length) this.liftLetter();
  }

  /** The last letter pressed comes back up. */
  private liftLetter() {
    this.stamps.pop();
    this.emitStamps();
    this.score.tick(600, 0.08);
    this.spray(this.x, this.y, C.green, 4);
  }

  /* ---------------------------------------------------------------- building */

  private build(room: Room): Live {
    const items: Item[] = [];
    const solids: Live["solids"] = [];
    const t = THEMES[room.theme];
    for (const prop of room.props) {
      const solid = solidOf(prop);
      if (solid) solids.push(solid);
      if (prop.riddle != null) {
        const riddle = prop.riddle;
        items.push({
          y: prop.y,
          draw: (ctx) => {
            const open = !!this.flags.solved[riddle];
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            ctx.fillRect(prop.x - 22, prop.y - 1, 44, 3);
            ctx.drawImage(sarcophagusPicture(t, open), prop.x - 22, prop.y - 33);
            const age = performance.now() - (this.tabletPulse.get(riddle) ?? -1e9);
            if (age < 900) {
              ctx.fillStyle = `rgba(0,235,136,${0.6 * (1 - age / 900)})`;
              ctx.fillRect(prop.x - 21, prop.y - 29, 42, 18);
            }
          },
        });
        continue;
      }
      const picture = propPicture(prop, room.theme);
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
    }
    for (const fire of room.fires) {
      if (!fire.big) continue;
      const solid = solidOfFire(fire);
      if (solid) solids.push(solid);
      items.push({ y: fire.y, draw: (ctx, time) => this.drawFire(ctx, room, fire, time) });
    }
    if (room.id === "chasm") {
      items.push({
        y: MECHANISM.foot,
        draw: (ctx, time) => this.drawMechanism(ctx, t, time),
      });
      // Tall enough that nothing can get behind it and vanish.
      solids.push({ x: MECHANISM.x - 34, y: MECHANISM.foot - 40, w: 68, h: 40 });
    }
    if (room.id === "sanctum") {
      items.push({ y: 112, draw: (ctx, time) => this.drawAltar(ctx, t, 160, 112, time) });
      solids.push({ x: 138, y: 96, w: 44, h: 16 });
    }
    const mirror = MIRRORS[room.id];
    if (mirror) {
      solids.push({ x: mirror.x - 13, y: mirror.foot - 6, w: 26, h: 7 });
      items.push({
        y: mirror.foot,
        draw: (ctx) => this.drawMirror(ctx, room, mirror.x, mirror.foot),
      });
    }
    if (room.id === "shop") {
      const cloths: [string, string][] = [
        ["#c9a14a", "#8a6a24"],
        ["#3f6f6a", "#274a46"],
        ["#b5502f", "#7a3320"],
      ];
      FOR_SALE.forEach((item, i) => {
        const { x, y } = ware(i);
        const [ink, dark] = cloths[i % cloths.length]!;
        const cushion = warePicture(item.price, ink, dark);
        const icon = cosmeticPicture(item);
        items.push({
          y,
          draw: (ctx, time) => {
            if (this.flags.owned.includes(item.id)) {
              // Sold: the empty cushion, no price.
              ctx.drawImage(cushion, 0, 0, 22, 8, x - 11, y - 8, 22, 8);
              return;
            }
            ctx.drawImage(cushion, x - 11, y - 8);
            const bob = !this.reduce && Math.floor(time * 2 + i) % 2 ? 1 : 0;
            ctx.drawImage(icon, x - Math.floor(icon.width / 2), y - 8 - icon.height + bob);
          },
        });
      });
      // The wagon along the wall.
      const wagon = wagonPicture();
      solids.push({ x: WAGON.x, y: 64, w: 76, h: WAGON.foot - 64 });
      items.push({
        y: WAGON.foot,
        draw: (ctx) => {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(WAGON.x + 2, WAGON.foot - 1, 74, 3);
          ctx.drawImage(wagon, WAGON.x, WAGON.foot - wagon.height + 1);
        },
      });
    }
    if (room.id === "den") {
      const cabinet = (kind: "arcade" | "blackjack", word: string) => {
        const { x, foot } = CABINETS[kind];
        const picture = cabinetPicture(t, word);
        const top = foot - picture.height + 1;
        solids.push({ x: x - 21, y: foot - 12, w: 42, h: 13 });
        items.push({
          y: foot,
          draw: (ctx, time) => {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(x - 22, foot - 1, 44, 3);
            ctx.drawImage(picture, x - 21, top);
            this.drawCabinetScreen(ctx, kind, x, top, time);
          },
        });
      };
      cabinet("arcade", "DINO");
      cabinet("blackjack", "21");
      for (const candle of CANDLES) {
        items.push({
          y: candle.y,
          draw: (ctx, time) => {
            ctx.fillStyle = "#cfc3a4";
            ctx.fillRect(candle.x - 1, candle.y - 5, 3, 6);
            ctx.fillStyle = "#3d3632";
            ctx.fillRect(candle.x - 2, candle.y, 5, 1);
            const lick = !this.reduce && Math.floor(time * 9 + candle.x) % 2 ? 1 : 0;
            ctx.fillStyle = "#e0852a";
            ctx.fillRect(candle.x - 1, candle.y - 8, 3, 3);
            ctx.fillStyle = "#ffd98a";
            ctx.fillRect(candle.x, candle.y - 9 - lick, 1, 3 + lick);
          },
        });
      }
    }
    items.sort((a, b) => a.y - b.y);
    const r = rng(room.w * 17 + room.at[0] * 5 + room.at[1] * 3 + 9);
    const motes = Array.from({ length: room.id === "mural" ? 36 : 22 }, () => ({
      x: r() * room.W,
      y: 40 + r() * (room.H - 50),
      s: 2 + r() * 5,
      p: r() * 6.28,
    }));
    return { room, bg: paintRoom(room, SQUARE), items, solids, motes };
  }

  /* ---------------------------------------------------------------- the world's rules */

  /** Doors that will not open yet. */
  private sealed(x: number, y: number) {
    const { id } = this.current.room;
    if (id === "mural") return !this.flags.pictured && x >= 368;
    if (id === "hall") return !this.flags.final && y < 64;
    return false;
  }

  private free(x: number, y: number) {
    const v = this.current.room.cell(x, y);
    if (!v) return false;
    return v === 1 || !this.sealed(x, y);
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

  /** The camera's corner when looking at a point of a room, in the room's own pixels. */
  private cameraAt(live: Live, x: number, y: number) {
    const axis = (view: number, size: number, at: number) =>
      size <= view
        ? -Math.floor((view - size) / 2)
        : Math.round(Math.min(size - view, Math.max(0, at - view / 2)));
    return { x: axis(this.viewW, live.room.W, x), y: axis(this.viewH, live.room.H, y) };
  }

  private camera(live: Live) {
    if (live !== this.current) return this.cameraAt(live, live.room.W / 2, live.room.H / 2);
    if (!this.lookAway) return this.cameraAt(live, this.x, this.y);
    return {
      x: Math.round(this.look.x - this.viewW / 2),
      y: Math.round(this.look.y - this.viewH / 2),
    };
  }

  /** The camera drifts to what a moment shows, and back to the dinosaur when it is over. */
  private stepLook(dt: number) {
    if (!this.lookAway) return;
    const target = this.lookTarget ?? this.framed(this.x, this.y);
    const k = Math.min(1, dt * 3);
    this.look.x += (target.x - this.look.x) * k;
    this.look.y += (target.y - this.look.y) * k;
    if (!this.lookTarget && Math.hypot(target.x - this.look.x, target.y - this.look.y) < 1) {
      this.lookAway = false;
    }
  }

  private setPrompt(label: string | null) {
    if (label === this.prompt) return;
    this.prompt = label;
    this.hooks.onPrompt(label);
  }

  /** Through a door: the camera pans along the map while the dinosaur walks to the far side. */
  private enter(side: Side, door: Door) {
    const from = this.current;
    const cam = this.camera(from);
    const camFrom = { x: cam.x + from.room.at[0], y: cam.y + from.room.at[1] };
    this.lookAway = false;
    this.lookTarget = null;
    const to = this.live.get(door.to)!;
    const landing = to.room.doors[OPPOSITE[side]]!.landing;
    const sx = this.x + from.room.at[0] - to.room.at[0];
    const sy = this.y + from.room.at[1] - to.room.at[1];
    this.current = to;
    this.x = landing.x;
    this.y = landing.y;
    this.lastSafe = { ...landing };
    const camEnd = this.camera(to);
    if (!this.reduce) {
      this.slide = {
        from,
        to,
        camFrom,
        camTo: { x: camEnd.x + to.room.at[0], y: camEnd.y + to.room.at[1] },
        sx,
        sy,
        ex: landing.x,
        ey: landing.y,
        t: 0,
      };
      this.x = sx;
      this.y = sy;
    }
    this.score.whoosh(0.05, 0.4);
    this.hooks.onRoom(to.room.id, landing.x, landing.y);
    this.score.fire(fireIn(to.room));
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

  /** The Hall's two loose stones, under the feet. The lift only wakes with the letters. */
  private stoneUnderFoot(): FloorStone | null {
    if (this.current.room.id !== "hall") return null;
    for (const [id, at] of Object.entries(FLOOR_STONES) as [
      FloorStone,
      { x: number; y: number },
    ][]) {
      if (id === "lift" && !this.flags.square) continue;
      if (
        this.x >= at.x &&
        this.x < at.x + SQUARE.tile &&
        this.y - 2 >= at.y &&
        this.y - 2 < at.y + SQUARE.tile
      ) {
        return id;
      }
    }
    return null;
  }

  private spikesUp(strip: Spikes, time: number) {
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
    // The room stays dark round the falling dinosaur; the light comes up from where it lands.
    if (this.iris > 0 && this.drop <= 0) this.iris = Math.max(0, this.iris - dt / 1.4);
    this.hurt = Math.max(0, this.hurt - dt);

    if (this.slide) {
      const s = this.slide;
      s.t += dt / SLIDE;
      const prevX = this.x;
      this.x = lerp(s.sx, s.ex, Math.min(1, s.t));
      this.y = lerp(s.sy, s.ey, Math.min(1, s.t));
      if (Math.abs(this.x - prevX) > 0.01) this.facing = Math.sign(this.x - prevX);
      this.moving = true;
      this.walked += SPEED * dt;
      if (s.t >= 1) {
        this.x = s.ex;
        this.y = s.ey;
        this.slide = null;
      }
      return;
    }

    if (this.drop > 0) {
      this.drop = Math.max(0, this.drop - dt);
      if (this.drop === 0) {
        this.shake(450, 3);
        this.score.stone();
        this.hooks.onLanded();
        for (let i = 0; i < 3; i += 1) this.spray(this.x, this.y, THEMES.sand.s7, 8);
      }
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

    if (this.cineLeft > 0) {
      this.moving = false;
      this.setPrompt(null);
      this.cineLeft -= dt;
      if (this.cineLeft <= 0) this.nextCine();
      this.throwEmbers(dt);
      return;
    }

    let dx = 0;
    let dy = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) dx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) dy -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dy += 1;
    if (dx || dy) {
      if (!this.movedOnce) {
        this.movedOnce = true;
        this.hooks.onFirstMove();
      }
      if (dx) this.facing = dx;
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    const nx = this.x + dx * SPEED * dt;
    if (!this.blocked(nx, this.y)) this.x = nx;
    const ny = this.y + dy * SPEED * dt;
    if (!this.blocked(this.x, ny)) this.y = ny;

    this.moving = !!(dx || dy);
    if (this.moving) {
      this.walked += SPEED * dt;
      if (time - this.lastStepSound > 0.27) {
        this.lastStepSound = time;
        this.score.tick(240 + Math.random() * 90, 0.045);
        if (!this.reduce && this.motes.length < 60) {
          this.motes.push({
            x: this.x - this.facing * 3,
            y: this.y,
            vx: -this.facing * 8,
            vy: -6,
            life: 0.3,
            ink: THEMES[this.current.room.theme].s5,
          });
        }
      }
    }

    // Through a door.
    for (const [side, door] of Object.entries(this.current.room.doors) as [Side, Door][]) {
      const across = side === "n" || side === "s" ? this.x : this.y;
      if (Math.abs(across - door.at) > 20) continue;
      const past =
        side === "n"
          ? this.y < door.line
          : side === "s"
            ? this.y > door.line
            : side === "w"
              ? this.x < door.line
              : this.x > door.line;
      if (past) {
        this.setPrompt(null);
        this.enter(side, door);
        return;
      }
    }

    this.hazards(time);
    this.findSpot();
    this.throwEmbers(dt);
  }

  private throwEmbers(dt: number) {
    if (this.reduce || this.motes.length >= 70) return;
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

  private hazards(time: number) {
    const room = this.current.room;
    if (room.spikes && this.hurt <= 0) {
      // The trap is one thing: a hit sends the dinosaur back past all of it, to the side it came in
      // from, however many strips it had got across.
      const west = room.spikes[0]!.x;
      const last = room.spikes[room.spikes.length - 1]!;
      const east = last.x + last.w;
      for (const strip of room.spikes) {
        if (
          this.x + 3 > strip.x &&
          this.x - 3 < strip.x + strip.w &&
          this.y > strip.y &&
          this.spikesUp(strip, time) === 2
        ) {
          this.x = this.lastSafe.x >= east ? east + 11 : west - 11;
          this.y = Math.max(this.lastSafe.y, strip.y + 8);
          this.hurt = 0.9;
          this.flashUntil = performance.now() + 160;
          this.shake(220, 2);
          this.score.hurt();
          this.spray(this.x, this.y, C.red, 8);
          break;
        }
      }
      if (this.x + 3 <= west || this.x - 3 >= east) this.lastSafe = { x: this.x, y: this.y };
    }
    if (room.floor) {
      const col = Math.floor(this.x / TILE);
      const row = Math.floor((this.y - 2) / TILE);
      const ch = room.floor[row]?.[col];
      if (ch === "h") {
        const id = `${col},${row}`;
        if (!this.revealed.has(id)) {
          this.revealed.add(id);
          this.score.reveal();
          this.spray(col * TILE + 8, row * TILE + 8, THEMES[room.theme].s6, 5);
        }
      } else if (ch === "p") {
        this.falling = FALL;
        this.score.fall();
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
      if (spot.untilPictured && this.flags.pictured) continue;
      if (spot.target.kind === "item" && this.flags.owned.includes(spot.target.id)) continue;
      const d = Math.hypot(this.x - spot.x, (this.y - spot.y) * 1.2);
      if (d < spot.r && d < bestD) {
        best = spot;
        bestD = d;
      }
    }
    this.here = best;
    this.tile = this.flags.final || best ? null : this.tileUnderFoot();
    this.stone = this.flags.final || best ? null : this.stoneUnderFoot();
    if (best) this.setPrompt(labelOf(best, this.flags));
    else if (this.tile) {
      this.setPrompt(`Press ${this.tile.letter === "I" ? "I / J" : this.tile.letter}`);
    } else if (this.stone) {
      this.setPrompt(this.stone === "lift" ? "Lift the last letter" : "Restart the fires");
    } else this.setPrompt(null);
  }

  /** What the fires are saying right now. */
  private fireNow(): FireNow {
    let t = (performance.now() - this.fireStart) % this.cycle;
    for (const beat of this.beats) {
      if (t < beat.ms) return { left: beat.left, right: beat.right, flare: !!beat.flare };
      t -= beat.ms;
    }
    return { left: 0, right: 0, flare: false };
  }

  /* ---------------------------------------------------------------- drawing */

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    if (this.asleep && now - this.lastDraw < 90) return;
    this.lastDraw = now;
    this.watchFrames(now);
    // A frame can be stamped a moment before the clock was last read.
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
    this.last = now;
    const time = now / 1000;
    if (!this.paused) this.update(dt, time);
    else if (this.cineLeft > 0) {
      // A moment that began as the close-up was closing keeps its own clock.
      this.cineLeft -= dt;
      if (this.cineLeft <= 0) this.nextCine();
    }
    this.stepAside(dt);
    this.stepLook(dt);
    this.stepMotes(dt);
    this.render(now, time);
    const room = this.current.room;
    const place = `${Math.round(this.x + room.at[0])},${Math.round(this.y + room.at[1])}`;
    if (place !== this.lastPlace) {
      this.lastPlace = place;
      this.hooks.onPlace(this.x + room.at[0], this.y + room.at[1]);
    }
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
  }

  private render(now: number, time: number) {
    const { ctx, R, viewW, viewH } = this;
    const flameTime = this.reduce ? 1 : time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let sx = 0;
    let sy = 0;
    if (now < this.shakeUntil) {
      sx = Math.round((Math.random() - 0.5) * 2 * this.shakeAmp);
      sy = Math.round((Math.random() - 0.5) * 2 * this.shakeAmp);
    }

    const dark = this.dark.ctx;
    dark.globalCompositeOperation = "source-over";
    dark.clearRect(0, 0, viewW, viewH);
    this.tints.length = 0;
    this.litAt = null;

    const fire = this.fireNow();
    if (this.slide) {
      const s = this.slide;
      const u = easeInOut(Math.min(1, s.t));
      const camX = lerp(s.camFrom.x, s.camTo.x, u);
      const camY = lerp(s.camFrom.y, s.camTo.y, u);
      const at = (live: Live) => ({
        x: Math.round(live.room.at[0] - camX) + sx,
        y: Math.round(live.room.at[1] - camY) + sy,
      });
      const a = at(s.from);
      const b = at(s.to);
      this.drawRoom(s.from, a.x, a.y, now, time, flameTime, fire, false);
      this.drawRoom(s.to, b.x, b.y, now, time, flameTime, fire, true);
      // The room left behind sinks into the dark, the one ahead comes out of it.
      dark.globalCompositeOperation = "source-over";
      dark.fillStyle = `rgba(0,0,0,${u})`;
      dark.fillRect(a.x, a.y, s.from.room.W, s.from.room.H);
      dark.fillStyle = `rgba(0,0,0,${1 - u})`;
      dark.fillRect(b.x, b.y, s.to.room.W, s.to.room.H);
    } else {
      const cam = this.camera(this.current);
      if (this.beside) {
        const [ax, ay] = this.current.room.at;
        const [bx, by] = this.beside.room.at;
        const x = bx - ax - cam.x + sx;
        const y = by - ay - cam.y + sy;
        this.drawRoom(this.beside, x, y, now, time, flameTime, fire, false);
      }
      this.drawRoom(this.current, -cam.x + sx, -cam.y + sy, now, time, flameTime, fire, true);
    }

    ctx.setTransform(R, 0, 0, R, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.dark.canvas, 0, 0);

    // Light colours what it falls on.
    ctx.globalCompositeOperation = "lighter";
    for (const t of this.tints) {
      ctx.globalAlpha = t.alpha;
      ctx.drawImage(tintPicture(t.r, t.ink), t.x - t.r, t.y - t.r);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    this.drawCharacters(time);
    ctx.setTransform(R, 0, 0, R, 0, 0);

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
    fire: FireNow,
    withPlayer: boolean,
  ) {
    const { ctx, R } = this;
    const room = live.room;
    ctx.setTransform(R, 0, 0, R, ox * R, oy * R);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(live.bg, 0, 0);
    this.drawFloorLife(room, time, withPlayer);
    this.drawWallLife(room, now, flameTime, fire);

    // Everything standing, back to front; the dinosaur's shadow among it, its body after the dark.
    let drewShadow = !withPlayer;
    for (const item of live.items) {
      if (!drewShadow && item.y > this.y) {
        this.drawPlayerShadow();
        drewShadow = true;
      }
      item.draw(ctx, flameTime);
    }
    if (!drewShadow) this.drawPlayerShadow();
    if (withPlayer) this.litAt = { live, ox, oy };

    this.drawMotes(live, time, withPlayer);
    this.cutLights(live, ox, oy, flameTime, fire, withPlayer);
  }

  private drawFloorLife(room: Room, time: number, withPlayer: boolean) {
    const ctx = this.ctx;
    const t = THEMES[room.theme];
    if (room.id === "hall") {
      this.drawSquare(performance.now(), t);
      this.drawFloorStones(performance.now(), t);
    }
    if (room.spikes) {
      for (const strip of room.spikes) {
        const state = this.spikesUp(strip, time);
        if (state === 0) continue;
        for (let y = strip.y + 3; y < strip.y + strip.h; y += 8) {
          for (let x = strip.x + 3; x < strip.x + strip.w; x += 8) {
            if (state === 1) {
              ctx.fillStyle = t.s7;
              ctx.fillRect(x + 1, y, 1, 1);
            } else {
              ctx.fillStyle = t.s6;
              ctx.fillRect(x, y - 2, 3, 3);
              ctx.fillStyle = t.s8;
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
          const x = col * TILE;
          const y = row * TILE;
          if (this.revealed.has(`${col},${row}`)) {
            drawPathStone(ctx, x, y, t);
          } else if (withPlayer && Math.hypot(this.x - x - 8, this.y - y - 8) < 30) {
            // The lantern catches the edge of a stone that should not be there.
            ctx.fillStyle = t.s5;
            ctx.fillRect(x + 1, y + 1, 3, 1);
            ctx.fillRect(x + 1, y + 1, 1, 3);
            ctx.fillRect(x + 12, y + 14, 3, 1);
            ctx.fillRect(x + 14, y + 12, 1, 3);
          }
        }),
      );
    }
  }

  private drawSquare(now: number, th: Theme) {
    const rows = this.flags.square;
    if (!rows) return;
    const ctx = this.ctx;
    const picture = kept(`square:${rows.join("")}`, () => {
      const { canvas, ctx: c } = makeCanvas(SQUARE.tile * 5, SQUARE.tile * 5);
      rows.forEach((row, r) =>
        [...row].forEach((letter, col) => {
          const x = col * SQUARE.tile;
          const y = r * SQUARE.tile;
          drawSquareTile(c, x, y, SQUARE.tile, th);
          if (letter === "I") {
            drawLetter(c, "I", x + 4, y + 6, th.s8);
            drawLetter(c, "J", x + 10, y + 6, th.s6);
          } else drawLetter(c, letter, x + 8, y + 6, th.s8);
        }),
      );
      return canvas;
    });
    const t = SQUARE.tile;
    const u = this.squareStart < 0 ? 1e9 : now - this.squareStart;
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        // Tile by tile out from the middle.
        const age = u - (Math.abs(r - 2) + Math.abs(c - 2)) * 130;
        if (age < 0) continue;
        ctx.drawImage(picture, c * t, r * t, t, t, SQUARE.x + c * t, SQUARE.y + r * t, t, t);
        if (age < 500) {
          ctx.fillStyle = `rgba(3,198,82,${0.55 * (1 - age / 500)})`;
          ctx.fillRect(SQUARE.x + c * t + 1, SQUARE.y + r * t + 1, t - 2, t - 2);
        }
      }
    }
    const pressed = new Set(this.stamps.map(({ r, c }) => `${r},${c}`));
    for (const id of pressed) {
      const [r, c] = id.split(",").map(Number) as [number, number];
      const x = SQUARE.x + c * t;
      const y = SQUARE.y + r * t;
      ctx.fillStyle = th.moss;
      ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
      ctx.fillStyle = th.s0;
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

  /** The marks on the Hall's loose stones: the arrow that restarts the fires, and the lifted letter. */
  private drawFloorStones(now: number, th: Theme) {
    const ctx = this.ctx;
    const t = SQUARE.tile;
    const restart = FLOOR_STONES.restart;
    drawRestartMark(ctx, restart.x + 10, restart.y + 10, C.mint);
    const lift = FLOOR_STONES.lift;
    if (this.flags.square) {
      const age = this.squareStart < 0 ? 1e9 : now - this.squareStart;
      if (age >= 0)
        drawLiftMark(ctx, lift.x + 10, lift.y + 10, this.stamps.length ? C.mint : th.s7);
      if (age >= 0 && age < 500) {
        ctx.fillStyle = `rgba(3,198,82,${0.55 * (1 - age / 500)})`;
        ctx.fillRect(lift.x + 1, lift.y + 1, t - 2, t - 2);
      }
    }
    if (this.stone) {
      const { x, y } = FLOOR_STONES[this.stone];
      ctx.fillStyle = C.green;
      ctx.fillRect(x, y, t, 1);
      ctx.fillRect(x, y + t - 1, t, 1);
      ctx.fillRect(x, y, 1, t);
      ctx.fillRect(x + t - 1, y, 1, t);
    }
  }

  private drawWallLife(room: Room, now: number, flameTime: number, fire: FireNow) {
    const ctx = this.ctx;
    const t = THEMES[room.theme];
    for (const spot of room.spots) {
      if (spot.target.kind === "tablet" && spot.ty != null) {
        this.drawTablet(spot.target.index, spot.x, spot.ty, now, t);
      }
    }
    if (room.id === "mural") {
      this.drawMural(now, t);
      this.drawSlab(now, t);
    }
    if (room.id === "shop") {
      for (const lamp of LANTERNS) {
        ctx.fillStyle = "#2a1c10";
        ctx.fillRect(lamp.x, lamp.y - 14, 1, 14);
        ctx.fillRect(lamp.x - 2, lamp.y, 5, 1);
        ctx.fillStyle = "#ffcf7a";
        ctx.fillRect(lamp.x - 2, lamp.y + 1, 5, 6);
        ctx.fillStyle = "#fff0c4";
        ctx.fillRect(lamp.x - 1, lamp.y + 2, 3, 4);
        ctx.fillStyle = "#2a1c10";
        ctx.fillRect(lamp.x - 2, lamp.y + 7, 5, 1);
      }
    }
    if (room.id === "gate") this.drawMask(now, t);
    if (room.id === "hall") this.drawGreatDoor(now, t);
    if (room.id === "sanctum" && this.flags.final) {
      drawWord(ctx, this.flags.final, 160, 21, t.s3, 3);
      drawWord(ctx, this.flags.final, 160, 19, t.s8, 3);
    }
    for (const f of room.fires) if (!f.big) this.drawFire(ctx, room, f, flameTime, fire);
  }

  private drawFire(
    ctx: CanvasRenderingContext2D,
    room: Room,
    fire: Fire,
    time: number,
    now = this.fireNow(),
  ) {
    const picture = brazierPicture(!!fire.big, room.theme);
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

  private drawTablet(index: number, cx: number, ty: number, now: number, t: Theme) {
    const ctx = this.ctx;
    const solved = !!this.flags.solved[index];
    const picture = kept(`tablet:${t.s5}:${index}:${solved}`, () => {
      const { canvas, ctx: c } = makeCanvas(30, 34);
      c.fillStyle = t.s1;
      c.fillRect(2, 1, 28, 33);
      c.fillStyle = t.s5;
      c.fillRect(2, 2, 26, 30);
      c.fillRect(4, 0, 22, 2);
      c.fillStyle = t.s7;
      c.fillRect(4, 0, 22, 1);
      c.fillRect(2, 2, 1, 30);
      c.fillStyle = t.s3;
      c.fillRect(5, 5, 20, 24);
      drawGlyphs(c, 7, 7, 17, 4, solved ? C.green : t.s6, index * 13 + 5);
      c.fillStyle = solved ? C.green : t.s4;
      c.fillRect(7, 27, 16, 1);
      return canvas;
    });
    ctx.drawImage(picture, cx - 15, ty);
    const age = now - (this.tabletPulse.get(index) ?? -1e9);
    if (age < 900) {
      ctx.fillStyle = `rgba(0,235,136,${0.6 * (1 - age / 900)})`;
      ctx.fillRect(cx - 13, ty + 2, 26, 30);
    }
  }

  private drawMural(now: number, t: Theme) {
    const ctx = this.ctx;
    const frame = kept("mural:frame", () => {
      const { canvas, ctx: c } = makeCanvas(MURAL.w, MURAL.h);
      c.fillStyle = t.s1;
      c.fillRect(0, 0, MURAL.w, MURAL.h);
      c.fillStyle = t.s5;
      c.fillRect(1, 1, MURAL.w - 2, MURAL.h - 2);
      c.fillStyle = t.s7;
      c.fillRect(1, 1, MURAL.w - 2, 1);
      c.fillRect(1, 1, 1, MURAL.h - 2);
      c.fillStyle = t.s3;
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
      c.fillStyle = t.s3;
      c.fillRect(0, 0, MURAL.iw, MURAL.ih);
      const r = rng(5);
      for (let i = 0; i < 300; i += 1) {
        c.fillStyle = r() < 0.5 ? t.s2 : t.s4;
        c.fillRect(Math.floor(r() * MURAL.iw), Math.floor(r() * MURAL.ih), 1, 1);
      }
      // A line of figures with no faces.
      for (let i = 0; i < 7; i += 1) {
        const cx = 11 + i * 18;
        const base = i % 2 ? 66 : 70;
        const head = base - 42;
        c.fillStyle = t.s5;
        c.fillRect(cx - 5, head + 1, 11, 11);
        c.fillRect(cx - 4, head, 9, 13);
        c.fillRect(cx - 2, head + 13, 5, 3);
        c.fillRect(cx - 8, head + 16, 17, base - head - 16 + 6);
        c.fillRect(cx - 6, head + 15, 13, 2);
        c.fillStyle = t.s6;
        c.fillRect(cx - 4, head, 9, 1);
        c.fillRect(cx - 8, head + 16, 1, base - head - 10);
        c.fillStyle = t.s3;
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
    // The photo has just been set: the frame takes it, in a flash round its edge.
    const age = this.muralStart < 0 ? 1e9 : now - this.muralStart;
    if (age < 800) {
      ctx.fillStyle = `rgba(0,235,136,${0.7 * (1 - age / 800)})`;
      ctx.fillRect(MURAL.x, MURAL.y, MURAL.w, MURAL.iy - MURAL.y);
      ctx.fillRect(MURAL.x, MURAL.iy + MURAL.ih, MURAL.w, MURAL.y + MURAL.h - MURAL.iy - MURAL.ih);
      ctx.fillRect(MURAL.x, MURAL.iy, MURAL.ix - MURAL.x, MURAL.ih);
      ctx.fillRect(
        MURAL.ix + MURAL.iw,
        MURAL.iy,
        MURAL.x + MURAL.w - MURAL.ix - MURAL.iw,
        MURAL.ih,
      );
    }
  }

  /** The stone that shuts the first room until they have stood before the wall. */
  private drawSlab(now: number, t: Theme) {
    const u = !this.flags.pictured
      ? 0
      : this.slabStart < 0
        ? 1
        : Math.min(1, Math.max(0, (now - this.slabStart) / 1500));
    if (u >= 1) return;
    const ctx = this.ctx;
    const h = Math.round(36 * (1 - u));
    ctx.fillStyle = t.s6;
    ctx.fillRect(368, 142, 16, h);
    ctx.fillStyle = t.s8;
    ctx.fillRect(368, 142, 1, h);
    ctx.fillStyle = t.s3;
    for (let y = 148; y < 142 + h; y += 8) ctx.fillRect(369, y, 15, 2);
  }

  private drawMask(now: number, t: Theme) {
    const ctx = this.ctx;
    const word = this.flags.word;
    const age = now - this.wordPulse;
    const open = !!word && (this.wordPulse < 0 || age > 0);
    const picture = kept(`mask:${open}`, () => maskPicture(MASK.w, MASK.h, open ? OPEN : SHUT, t));
    ctx.drawImage(picture, MASK.x, MASK.y);
    const cx = MASK.x + MASK.w / 2;
    // Five sockets in its crown, a green stone in each riddle answered.
    const solved = this.flags.solved;
    for (let i = 0; i < 5; i += 1) {
      const x = cx + (i - 2) * 13 - 6;
      const y = MASK.y + 1 + Math.abs(i - 2);
      ctx.fillStyle = C.void;
      ctx.fillRect(x, y, 12, 12);
      ctx.fillStyle = t.s6;
      ctx.fillRect(x, y + 12, 12, 1);
      if (solved[i]) {
        ctx.fillStyle = C.deep;
        ctx.fillRect(x + 1, y + 1, 10, 10);
        ctx.fillStyle = C.green;
        ctx.fillRect(x + 2, y + 2, 8, 8);
        ctx.fillStyle = C.mint;
        ctx.fillRect(x + 2, y + 2, 3, 3);
      }
    }
    if (solved.every(Boolean)) {
      // All five, and something behind the eyes.
      ctx.fillStyle = word ? C.mint : C.green;
      const ey = MASK.y + Math.round(MASK.h * 0.32);
      ctx.fillRect(cx - 18, ey, 9, 3);
      ctx.fillRect(cx + 9, ey, 9, 3);
    }
    if (open && word) {
      drawWord(
        ctx,
        word,
        cx,
        MASK.y + Math.round(MASK.h * 0.66),
        age > 0 && age < 900 ? C.white : C.green,
      );
    }
  }

  private doorLeaves(broken: boolean, t: Theme) {
    return kept(`door:${broken}`, () => {
      const { canvas, ctx: c } = makeCanvas(GREAT_DOOR.w - 16, GREAT_DOOR.h - 8);
      const W = canvas.width;
      const H = canvas.height;
      c.fillStyle = t.s3;
      c.fillRect(0, 0, W, H);
      for (const x of [0, W / 2]) {
        c.fillStyle = t.s4;
        c.fillRect(x + 2, 2, W / 2 - 4, 1);
        c.fillRect(x + 2, 2, 1, H - 4);
        c.fillStyle = t.s2;
        c.fillRect(x + 4, 5, W / 2 - 8, H - 10);
        c.fillStyle = t.s4;
        for (let y = 8; y < H - 8; y += 7) c.fillRect(x + 6, y, W / 2 - 12, 1);
      }
      c.fillStyle = C.void;
      c.fillRect(W / 2 - 1, 0, 2, H);
      // The wax, across the join.
      const inks: Record<string, string> = {
        o: broken ? C.deep : C.green,
        d: broken ? t.moss : C.deep,
        s: broken ? t.moss : C.deep,
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

  private drawGreatDoor(now: number, t: Theme) {
    const ctx = this.ctx;
    const d = GREAT_DOOR;
    const frame = kept("door:frame", () => {
      const { canvas, ctx: c } = makeCanvas(d.w, d.h);
      c.fillStyle = t.s1;
      c.fillRect(0, 0, d.w, d.h);
      c.fillStyle = t.s6;
      c.fillRect(1, 1, 7, d.h - 1);
      c.fillRect(d.w - 8, 1, 7, d.h - 1);
      c.fillRect(1, 1, d.w - 2, 7);
      c.fillStyle = t.s7;
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
    const leaves = this.doorLeaves(!!this.flags.square, t);
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
    // Open: stairs going up into gold, the leaves drawn apart.
    const g = THEMES.gold;
    ctx.fillStyle = C.void;
    ctx.fillRect(ix, iy, W, H);
    [t.s4, t.s3, t.s3, g.s2, g.s3, g.s4, g.s5].forEach((ink, i) => {
      const inset = 2 + i * 3;
      const y = iy + H - 6 - i * 5;
      ctx.fillStyle = ink;
      ctx.fillRect(ix + inset, y, W - inset * 2, 4);
      ctx.fillStyle = t.s0;
      ctx.fillRect(ix + inset, y + 4, W - inset * 2, 1);
    });
    ctx.fillStyle = g.s7;
    ctx.fillRect(ix + W / 2 - 6, iy + H - 44, 12, 3);
    const slide = Math.round(u * (W / 2));
    const left = W / 2 - slide;
    if (left > 0) {
      ctx.drawImage(leaves, slide, 0, left, H, ix, iy, left, H);
      ctx.drawImage(leaves, W / 2, 0, left, H, ix + W / 2 + slide, iy, left, H);
    }
  }

  /** The bronze machine on its island: geared wheels that turn once there is something to read. */
  private drawMechanism(ctx: CanvasRenderingContext2D, t: Theme, time: number) {
    const { carved, stoneRead } = this.flags;
    const { x: cx, foot } = MECHANISM;
    const picture = kept(`mechanism:${carved}:${stoneRead}`, () => {
      const W = 72;
      const H = 58;
      const { canvas, ctx: c } = makeCanvas(W, H);
      const b = stoneRead ? PATINA : BRONZE;
      // The plate that will carry the message.
      c.fillStyle = b.shade;
      c.fillRect(21, 0, 30, 26);
      c.fillStyle = b.rim;
      c.fillRect(21, 0, 30, 1);
      c.fillRect(21, 0, 1, 26);
      c.fillStyle = b.dark;
      c.fillRect(24, 3, 24, 20);
      drawGreek(c, 25, 5, 4, 2, stoneRead ? C.green : carved ? b.rim : b.shade, 3);
      // The case.
      c.fillStyle = b.face;
      c.fillRect(2, 26, 68, 22);
      c.fillStyle = b.rim;
      c.fillRect(2, 26, 68, 1);
      c.fillRect(2, 26, 1, 22);
      c.fillStyle = b.shade;
      c.fillRect(66, 27, 4, 21);
      c.fillStyle = b.dark;
      c.fillRect(5, 29, 62, 16);
      // The stone it stands on.
      c.fillStyle = t.s6;
      c.fillRect(0, 48, W, 4);
      c.fillStyle = t.s7;
      c.fillRect(0, 48, W, 1);
      c.fillStyle = t.s4;
      c.fillRect(0, 52, W, 6);
      return canvas;
    });
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(cx - 36, foot - 1, 72, 3);
    const top = foot - picture.height + 1;
    const inks = stoneRead ? PATINA : BRONZE;
    const speed = this.reduce ? 0 : stoneRead ? 10 : carved ? 4 : 0;
    const step = Math.floor(time * speed);
    const turn = (dir: number) => (((step * dir) % 16) + 16) % 16;
    // Two great drive wheels behind the case, either side of the plate.
    ctx.drawImage(gearPicture(23, 10, turn(1), inks), cx - 35, top + 5);
    ctx.drawImage(gearPicture(23, 10, turn(-1), inks), cx + 12, top + 5);
    ctx.drawImage(picture, cx - 36, top);
    // Five wheels across the case, each turning against the next.
    for (let i = 0; i < 5; i += 1) {
      ctx.drawImage(gearPicture(13, 8, turn(i % 2 ? 1 : -1), inks), cx - 31 + i * 12, top + 31);
    }
    const age = performance.now() - this.stonePulse;
    if (age < 1400) {
      ctx.fillStyle = `rgba(0,235,136,${0.5 * (1 - age / 1400)})`;
      ctx.fillRect(cx - 12, top + 3, 24, 20);
    }
  }

  private drawAltar(
    ctx: CanvasRenderingContext2D,
    t: Theme,
    cx: number,
    foot: number,
    time: number,
  ) {
    const picture = kept("altar", () => {
      const { canvas, ctx: c } = makeCanvas(44, 26);
      c.fillStyle = t.s8;
      c.fillRect(0, 0, 44, 3);
      c.fillStyle = t.s6;
      c.fillRect(3, 3, 38, 18);
      c.fillStyle = t.s4;
      c.fillRect(28, 3, 13, 18);
      c.fillStyle = t.s2;
      for (let x = 6; x < 36; x += 6) {
        c.fillRect(x, 8, 4, 1);
        c.fillRect(x, 8, 1, 6);
        c.fillRect(x, 14, 5, 1);
        c.fillRect(x + 2, 11, 1, 2);
      }
      c.fillStyle = t.s7;
      c.fillRect(0, 21, 44, 5);
      return canvas;
    });
    ctx.fillStyle = "rgba(40,20,0,0.45)";
    ctx.fillRect(cx - 22, foot - 1, 44, 3);
    ctx.drawImage(picture, cx - 22, foot - 25);
    if (this.flags.final) drawFlame(ctx, cx, foot - 26, 7, 20, time, 3, false);
  }

  /** The dinosaur's shadow lies on the floor, under the dark; the body is drawn after it. */
  private drawPlayerShadow() {
    if (this.drop > 0 || this.falling > 0) return;
    if (this.hurt > 0 && !this.reduce && Math.floor(this.hurt * 12) % 2 === 0) return;
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(Math.round(this.x) - 8, Math.round(this.y) - 1, 16, 3);
  }

  private drawPlayerBody(ctx: CanvasRenderingContext2D, time: number) {
    const look = this.flags.look;
    const step = this.moving ? Math.floor(this.walked / 9) % 4 : 0;
    const bob = this.moving && !this.reduce && step % 2 === 1 ? -1 : 0;
    const blink = !this.reduce && time % 4 < 0.12;
    const flip = this.facing < 0;
    const footX = flip ? DINO_W - 1 - DINO_FOOT_X : DINO_FOOT_X;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    if (this.drop > 0) {
      // In through the roof, whole cells at a time.
      const u = 1 - (1 - this.drop / DROP) ** 2;
      ctx.drawImage(
        dinoFrame(1, false, flip, look),
        px - footX,
        py - DINO_H + 1 - Math.round(u * 260),
      );
      return;
    }
    if (this.falling > 0) {
      const u = 1 - this.falling / FALL;
      const down = Math.round(u * u * 40);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px - 22, py - DINO_H - 2, 44, DINO_H + 4);
      ctx.clip();
      ctx.drawImage(dinoFrame(0, false, flip, look), px - footX, py - DINO_H + 1 + down);
      ctx.restore();
      return;
    }
    if (this.hurt > 0 && !this.reduce && Math.floor(this.hurt * 12) % 2 === 0) return;
    ctx.drawImage(dinoFrame(step, blink, flip, look), px - footX, py - DINO_H + 1 + bob);
  }

  /**
   * Characters go on after the dark, so its dither never falls across them: they are the one thing
   * always seen cleanly. Whatever stands in front is cut out of them first, so they still pass
   * behind a column.
   */
  private drawLit(
    cx: number,
    footY: number,
    time: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ) {
    const lit = this.litAt;
    if (!lit) return;
    const { canvas, ctx: layer } = this.litLayer;
    const left = Math.round(cx) - 48;
    const top = Math.round(footY) - 72;
    layer.setTransform(1, 0, 0, 1, 0, 0);
    layer.globalCompositeOperation = "source-over";
    layer.clearRect(0, 0, canvas.width, canvas.height);
    layer.setTransform(1, 0, 0, 1, -left, -top);
    draw(layer);
    layer.globalCompositeOperation = "destination-out";
    for (const item of lit.live.items) {
      if (item.y > footY) item.draw(layer, this.reduce ? 1 : time);
    }
    const { ctx, R } = this;
    ctx.setTransform(R, 0, 0, R, lit.ox * R, lit.oy * R);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, left, top);
  }

  private drawCharacters(time: number) {
    const lit = this.litAt;
    if (!lit) return;
    if (this.drop > 0) {
      const { ctx, R } = this;
      ctx.setTransform(R, 0, 0, R, lit.ox * R, lit.oy * R);
      this.drawPlayerBody(ctx, time);
    } else {
      this.drawLit(this.x, this.y, time, (ctx) => this.drawPlayerBody(ctx, time));
    }
    if (this.here && !this.paused && !this.slide && this.cineLeft <= 0) {
      const { ctx, R } = this;
      ctx.setTransform(R, 0, 0, R, lit.ox * R, lit.oy * R);
      this.drawKeycap(this.here, time);
    }
  }

  /** A floor mirror leaning on the wall, and the dinosaur in it once it comes close. */
  private drawMirror(ctx: CanvasRenderingContext2D, room: Room, x: number, foot: number) {
    const left = x - 15;
    const top = foot - MIRROR.h + 1;
    ctx.drawImage(mirrorPicture(), left, top);
    if (room === this.current.room && Math.hypot(this.x - x, this.y - foot) < 70) {
      ctx.save();
      ctx.beginPath();
      for (const row of MIRROR_GLASS) ctx.rect(left + row.x, top + row.y, row.w, 1);
      ctx.clip();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(
        dinoFrame(0, false, this.facing > 0, this.flags.look),
        x - 17,
        top + 15 + Math.round(Math.min(4, Math.abs(this.x - x) / 12)),
      );
      ctx.restore();
    }
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (const row of MIRROR_GLASS) {
      if (row.y < 37) ctx.fillRect(left + row.x + 2, top + row.y, 2, 1);
      if (row.y < 24) ctx.fillRect(left + row.x + 6, top + row.y, 1, 1);
    }
  }

  /** A cabinet's screen, alive. */
  private drawCabinetScreen(
    ctx: CanvasRenderingContext2D,
    kind: "arcade" | "blackjack",
    cx: number,
    top: number,
    time: number,
  ) {
    const x = cx - 17;
    const y = top + 21;
    const w = 34;
    const h = 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (kind === "arcade") {
      // The game itself in small: the dinosaur, in the player's colour, clearing a column.
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#c9c4b0";
      ctx.fillRect(x + 4, y + 3, 1, 1);
      ctx.fillRect(x + 15, y + 6, 1, 1);
      ctx.fillRect(x + 27, y + 2, 1, 1);
      ctx.fillStyle = "#e8e4d0";
      ctx.fillRect(x + 27, y + 4, 2, 4);
      ctx.fillRect(x + 26, y + 5, 4, 2);
      const ground = y + h - 3;
      ctx.fillStyle = "#c9a877";
      ctx.fillRect(x, ground, w, 1);
      ctx.fillStyle = "#6f5636";
      ctx.fillRect(x, ground + 1, w, 2);
      const run = this.reduce ? 0 : Math.floor(time * 16) % 44;
      const cx0 = x + 40 - run;
      // A little column coming on.
      ctx.fillStyle = "#e8e4d0";
      ctx.fillRect(cx0, ground - 9, 5, 1);
      ctx.fillRect(cx0 + 1, ground - 8, 3, 8);
      ctx.fillStyle = "#a8a294";
      ctx.fillRect(cx0 + 2, ground - 7, 1, 7);
      ctx.fillRect(cx0, ground - 1, 5, 1);
      // The hop: it leaves the ground as the column arrives and lands past it.
      const u = (run - 23) / 13;
      const hop = u > 0 && u < 1 ? Math.round(Math.sin(u * Math.PI) * 11) : 0;
      const legs = hop ? 0 : Math.floor(time * 10) % 2;
      ctx.drawImage(miniDino(this.flags.look.color, legs), x + 6, ground - 10 - hop);
    } else {
      // Two painted cards on black.
      ctx.fillStyle = "#0a0705";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#c96f33";
      ctx.fillRect(x, y, w, 1);
      ctx.fillRect(x, y + h - 1, w, 1);
      const glint = this.reduce ? 0 : Math.floor(time * 1.5) % 2;
      for (const [cardX, cardY] of [
        [x + 7, y + 5],
        [x + 18, y + 6],
      ] as const) {
        ctx.fillStyle = "#c96f33";
        ctx.fillRect(cardX, cardY, 10, 14);
        ctx.fillStyle = "#14100c";
        ctx.fillRect(cardX, cardY, 10, 1);
        ctx.fillRect(cardX, cardY + 13, 10, 1);
        ctx.fillRect(cardX + 3, cardY + 4, 4, 2);
        ctx.fillRect(cardX + 2, cardY + 6, 6, 3);
        ctx.fillRect(cardX + 4, cardY + 9, 2, 2);
      }
      ctx.fillStyle = glint ? "#efdbb2" : "#c96f33";
      ctx.fillRect(x + 7, y + 5, 1, 1);
    }
    ctx.restore();
    // The screen's own glass.
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, w, 2);
  }

  private drawMotes(live: Live, time: number, withPlayer: boolean) {
    const ctx = this.ctx;
    if (!this.reduce) {
      const sunlit = live.room.id === "mural" || live.room.id === "sanctum";
      ctx.fillStyle = sunlit ? "rgba(255,240,200,0.5)" : "rgba(190,200,190,0.28)";
      for (const m of live.motes) {
        const x = Math.round(m.x + Math.sin(time * 0.25 + m.p) * m.s * 3);
        // In the first room the dust falls, through the light from the hole they came by.
        const y = sunlit
          ? 40 + ((m.y + time * (3 + m.s)) % (live.room.H - 50))
          : Math.round(m.y + Math.cos(time * 0.18 + m.p) * m.s * 2);
        if (live.room.cell(x, Math.round(y))) ctx.fillRect(x, Math.round(y), 1, 1);
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
        { "#": "#d9d5c8", "-": "#57544b" },
      ),
    );
    ctx.drawImage(cap, (spot.capX ?? spot.x) - 5, spot.capY + bob);
  }

  private cutLights(
    live: Live,
    ox: number,
    oy: number,
    flameTime: number,
    fire: FireNow,
    withPlayer: boolean,
  ) {
    const dark = this.dark.ctx;
    const room = live.room;
    // This room's own dark: the first and last rooms are brighter than the rest.
    dark.globalCompositeOperation = "source-over";
    const ambient = room.ambient + (1 - room.ambient) * Math.min(1, this.iris * 1.4);
    dark.fillStyle = `rgba(2,5,4,${ambient})`;
    dark.fillRect(ox, oy, room.W, room.H);
    dark.globalCompositeOperation = "destination-out";

    const pool = (x: number, y: number, radius: number) => {
      const r = Math.round(radius / 4) * 4;
      dark.drawImage(lightPicture(r), Math.round(x + ox - r), Math.round(y + oy - r));
    };
    const tint = (x: number, y: number, radius: number, ink: string, alpha: number) => {
      this.tints.push({
        x: Math.round(x + ox),
        y: Math.round(y + oy),
        r: Math.round(radius / 4) * 4,
        ink,
        alpha,
      });
    };
    const flicker = (seed: number) =>
      this.reduce ? 0 : Math.sin(flameTime * 8 + seed) * 2 + Math.sin(flameTime * 13.7 + seed) * 2;
    const flareInk = fire.flare ? C.red : C.green;
    for (const f of room.fires) {
      const lit = f.i < (f.side === "L" ? fire.left : fire.right);
      const seed = f.x * 0.37 + f.i * 2.1;
      const high = f.big ? f.y - 18 : f.y - 8;
      if (lit) {
        const radius = (f.big ? 76 : 64) + flicker(seed);
        pool(f.x, high, radius);
        tint(f.x, high, radius, flareInk, fire.flare ? 0.2 : 0.13);
      } else pool(f.x, high, 12);
    }
    const { flags } = this;
    switch (room.id) {
      case "mural":
        // Daylight from the hole in the roof, on the mosaic where they landed.
        pool(192, 152, 104);
        tint(192, 152, 88, THEMES.sand.s8, 0.14);
        pool(192, 50, flags.photo ? 124 : 80);
        // What gets past the mural, enough to find the mirror and the far wall by.
        pool(58, 78, 72);
        pool(342, 150, 76);
        // The way out: green firelight from the Hall, once the slab has begun to move.
        if (flags.pictured && performance.now() > this.slabStart) {
          pool(372, 160, 56);
          tint(372, 160, 48, C.green, 0.16);
        }
        break;
      case "gate":
        pool(192, 50, flags.word ? 112 : 60 + 6 * flags.solved.filter(Boolean).length);
        if (flags.solved.every(Boolean)) tint(192, 40, 56, C.green, 0.12);
        break;
      case "hall":
        pool(192, 36, 52);
        if (flags.square) pool(192, 128, 84);
        if (flags.final) {
          pool(192, 44, 96);
          tint(192, 40, 56, THEMES.gold.s7, 0.2);
        }
        break;
      case "chasm":
        pool(192, 112, flags.stoneRead ? 96 : 56);
        tint(192, 112, 56, flags.stoneRead ? C.green : THEMES.bronze.frieze, 0.12);
        break;
      case "shop": {
        // Lamplight, warm and uneven.
        for (const lamp of LANTERNS) {
          pool(lamp.x, lamp.y + 10, 72 + flicker(lamp.x));
          tint(lamp.x, lamp.y + 10, 72, "#e8953a", 0.1);
        }
        pool(90, 120, 80);
        pool(240, 140, 80);
        tint(160, 140, 120, "#a8582a", 0.05);
        break;
      }
      case "den":
        for (const candle of CANDLES) {
          pool(candle.x, candle.y - 8, 36 + flicker(candle.x) * 1.5);
          tint(candle.x, candle.y - 8, 28, "#e0852a", 0.1);
        }
        pool(CABINETS.arcade.x, 34, 48);
        tint(CABINETS.arcade.x, 34, 40, "#7ea6d8", 0.08);
        pool(CABINETS.blackjack.x, 34, 48);
        tint(CABINETS.blackjack.x, 34, 40, "#c96f33", 0.1);
        break;
      case "sanctum":
        pool(160, 110, 152);
        pool(160, 30, 112);
        tint(160, 100, 140, THEMES.gold.s7, 0.05);
        break;
      default:
        break;
    }
    for (const spot of room.spots) {
      if (spot.target.kind === "tablet") {
        const lit = flags.solved[spot.target.index];
        pool(spot.x, spot.ty != null ? spot.ty + 18 : spot.y - 24, lit ? 40 : 28);
        if (lit) tint(spot.x, spot.ty != null ? spot.ty + 18 : spot.y - 24, 32, C.green, 0.12);
      }
    }
    if (withPlayer) {
      // In the den the dinosaur carries hardly any light of its own.
      const reach = room.id === "den" ? 44 : 84;
      const radius = this.iris > 0 ? reach * (1 - this.iris) + 8 : reach;
      pool(this.x, this.y - 10, radius);
    }
  }
}

function sameTarget(a: Target, b: Target) {
  return (
    a.kind === b.kind &&
    (a.kind !== "tablet" || a.index === (b as { index: number }).index) &&
    (a.kind !== "note" || a.text === (b as { text: string }).text)
  );
}

export { ROOMS };
