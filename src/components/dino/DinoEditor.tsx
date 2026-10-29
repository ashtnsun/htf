"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Crop,
  Download,
  Eraser,
  FlipHorizontal2,
  Minus,
  PaintBucket,
  Pencil,
  Pipette,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  BRAND_COLORS,
  INK_CHARS,
  fileSlug,
  fill,
  flipX,
  paint,
  parseCode,
  removeColor,
  resize,
  shift,
  toCode,
  toPngBlob,
  toSvg,
  trim,
  drawSprite,
  type Sprite,
} from "@/components/dino/sprite";
import { VARIANTS } from "@/components/dino/variants";
import { cn } from "@/lib/utils";

/**
 * The dinosaur editor (/dino): a pixel canvas that starts on the footer T-rex, a palette whose
 * colours can be changed (every cell of a colour follows), the canvas grown or cut by whole
 * cells at each edge, and exports as PNG, SVG or a string-map constant ready to paste into the
 * codebase. The variants under it (components/dino/variants) load with one click, as does
 * anything saved in this browser or pasted back in. Rendered on the client only (DinoEditorLoader),
 * so reading localStorage while the state is set up never mismatches a server render.
 *
 * Left button draws with the current tool, the right button erases (the browser's menu is
 * suppressed on the canvas only). The canvas also takes the keyboard: arrows move a cursor,
 * Space or Enter applies the tool. Shortcuts: B pencil, E eraser, G fill, I picker, 1-9 a
 * colour, Ctrl+Z / Ctrl+Shift+Z undo and redo.
 */

type Tool = "pencil" | "eraser" | "fill" | "picker";

type History = {
  sprite: Sprite;
  past: Sprite[];
  future: Sprite[];
  /** The sprite as it was when the current stroke began (one stroke is one undo step). */
  stroke: Sprite | null;
  /** Consecutive changes with the same key (dragging a colour picker) share one undo step. */
  lastKey: string | null;
};

type Action =
  | { type: "apply"; fn: (s: Sprite) => Sprite; key?: string }
  | { type: "begin" }
  | { type: "draw"; fn: (s: Sprite) => Sprite }
  | { type: "end" }
  | { type: "undo" }
  | { type: "redo" };

const HISTORY_LIMIT = 200;

function reducer(state: History, action: Action): History {
  switch (action.type) {
    case "apply": {
      const next = action.fn(state.sprite);
      if (next === state.sprite) return state;
      if (action.key && action.key === state.lastKey) return { ...state, sprite: next };
      return {
        sprite: next,
        past: [...state.past, state.sprite].slice(-HISTORY_LIMIT),
        future: [],
        stroke: null,
        lastKey: action.key ?? null,
      };
    }
    case "begin":
      return { ...state, stroke: state.sprite, lastKey: null };
    case "draw": {
      const next = action.fn(state.sprite);
      return next === state.sprite ? state : { ...state, sprite: next };
    }
    case "end":
      if (!state.stroke) return state;
      if (state.stroke === state.sprite) return { ...state, stroke: null };
      return {
        ...state,
        past: [...state.past, state.stroke].slice(-HISTORY_LIMIT),
        future: [],
        stroke: null,
      };
    case "undo": {
      const prev = state.past.at(-1);
      if (!prev) return state;
      return {
        sprite: prev,
        past: state.past.slice(0, -1),
        future: [state.sprite, ...state.future],
        stroke: null,
        lastKey: null,
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        sprite: next,
        past: [...state.past, state.sprite],
        future: state.future.slice(1),
        stroke: null,
        lastKey: null,
      };
    }
  }
}

const SAVED_KEY = "htf-dino-saved";
const DRAFT_KEY = "htf-dino-draft";

function isSprite(value: unknown): value is Sprite {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<Sprite>;
  return (
    typeof s.name === "string" &&
    typeof s.width === "number" &&
    typeof s.height === "number" &&
    Array.isArray(s.palette) &&
    Array.isArray(s.cells) &&
    s.cells.length === s.width * s.height
  );
}

function readStored(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows and full storage: saving is a convenience, the editor works without it.
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Cells on the line between two cells, so a fast drag leaves no gaps. */
function lineCells(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const out: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    out.push([x, y]);
    if (x === x1 && y === y1) return out;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

const btn =
  "hover-corners inline-flex h-11 min-w-11 items-center justify-center gap-2 border border-line bg-bg px-3 text-body text-text transition-colors hover:border-line-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40";

function ToolButton({
  label,
  icon: Icon,
  onClick,
  pressed,
  disabled,
  children,
  className,
}: {
  label: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={children ? undefined : label}
      title={label}
      disabled={disabled}
      className={cn(btn, pressed && "border-green text-green", className)}
    >
      {Icon ? <Icon className="size-4.5 shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="border border-line bg-surface p-5">
      <h2 id={id} className="mb-4 text-eyebrow font-medium text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A sprite as a crisp SVG, for the preview and the variant thumbnails. */
export function SpriteSvg({ sprite, className }: { sprite: Sprite; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${sprite.width} ${sprite.height}`}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {sprite.cells.map((v, i) =>
        v === 0 ? null : (
          <rect
            key={i}
            x={i % sprite.width}
            y={Math.floor(i / sprite.width)}
            width={1}
            height={1}
            fill={sprite.palette[v - 1]}
          />
        ),
      )}
    </svg>
  );
}

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Pencil }[] = [
  { id: "pencil", label: "Pencil (B)", key: "b", icon: Pencil },
  { id: "eraser", label: "Eraser (E)", key: "e", icon: Eraser },
  { id: "fill", label: "Fill (G)", key: "g", icon: PaintBucket },
  { id: "picker", label: "Pick a colour (I)", key: "i", icon: Pipette },
];

const EDGES = ["top", "right", "bottom", "left"] as const;
/** The variant groups in the order they are listed: the starting points, then each god. */
const GROUPS = [...new Set(VARIANTS.map((v) => v.group))];

export function DinoEditor() {
  const [history, dispatch] = useReducer(reducer, null, () => ({
    sprite: VARIANTS[0]!.sprite,
    past: [],
    future: [],
    stroke: null,
    lastKey: null,
  }));
  const { sprite } = history;
  const [tool, setTool] = useState<Tool>("pencil");
  const [ink, setInk] = useState(1);
  const [scale, setScale] = useState(16);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<Sprite[]>(() => {
    const stored = readStored(SAVED_KEY);
    return Array.isArray(stored) ? stored.filter(isSprite) : [];
  });
  const [lastDraft] = useState<Sprite | null>(() => {
    const stored = readStored(DRAFT_KEY);
    return isSprite(stored) ? stored : null;
  });
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [cellPx, setCellPx] = useState(20);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCell = useRef<{ x: number; y: number } | null>(null);
  const strokeValue = useRef(0);

  const activeInk = Math.min(ink, sprite.palette.length);

  // The working sprite survives a reload as "Last draft" (never as the starting picture).
  useEffect(() => {
    writeStored(DRAFT_KEY, sprite);
  }, [sprite]);

  // Cell size: as large as the column allows, up to 32px a cell and 70% of the viewport tall.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const byWidth = Math.floor(wrap.clientWidth / sprite.width);
      const byHeight = Math.floor((window.innerHeight * 0.7) / sprite.height);
      setCellPx(Math.max(4, Math.min(32, byWidth, byHeight)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [sprite.width, sprite.height]);

  // Draw: a faint checkerboard for empty cells, the cells, hairline grid, the cursor.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = sprite.width * cellPx;
    const h = sprite.height * cellPx;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111111";
    for (let y = 0; y < sprite.height; y += 1) {
      for (let x = y % 2; x < sprite.width; x += 2) {
        ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
      }
    }
    drawSprite(ctx, sprite, cellPx);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < sprite.width; x += 1) {
      ctx.moveTo(x * cellPx + 0.5, 0);
      ctx.lineTo(x * cellPx + 0.5, h);
    }
    for (let y = 1; y < sprite.height; y += 1) {
      ctx.moveTo(0, y * cellPx + 0.5);
      ctx.lineTo(w, y * cellPx + 0.5);
    }
    ctx.stroke();
    if (cursor && cursor.x < sprite.width && cursor.y < sprite.height) {
      ctx.strokeStyle = "#00eb88";
      ctx.lineWidth = 2;
      ctx.strokeRect(cursor.x * cellPx + 1, cursor.y * cellPx + 1, cellPx - 2, cellPx - 2);
    }
  }, [sprite, cellPx, cursor]);

  const apply = (fn: (s: Sprite) => Sprite, key?: string) => dispatch({ type: "apply", fn, key });

  /** Applies the current tool (or the eraser, for the right button) to one cell. */
  const applyTool = (x: number, y: number, value: number, stroke: boolean) => {
    if (tool === "picker") {
      const picked = sprite.cells[y * sprite.width + x];
      if (picked) {
        setInk(picked);
        setTool("pencil");
      }
      return;
    }
    if (tool === "fill" && value !== 0) {
      apply((s) => fill(s, x, y, value));
      return;
    }
    if (stroke) dispatch({ type: "draw", fn: (s) => paint(s, x, y, value) });
    else apply((s) => paint(s, x, y, value));
  };

  const cellAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellPx);
    const y = Math.floor((event.clientY - rect.top) / cellPx);
    if (x < 0 || y < 0 || x >= sprite.width || y >= sprite.height) return null;
    return { x, y };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.button !== 2) return;
    const cell = cellAt(event);
    if (!cell) return;
    event.preventDefault();
    const erase = event.button === 2 || tool === "eraser";
    strokeValue.current = erase ? 0 : activeInk;
    if (erase || tool === "pencil") {
      event.currentTarget.setPointerCapture(event.pointerId);
      lastCell.current = cell;
      dispatch({ type: "begin" });
      dispatch({ type: "draw", fn: (s) => paint(s, cell.x, cell.y, strokeValue.current) });
    } else {
      applyTool(cell.x, cell.y, strokeValue.current, false);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const from = lastCell.current;
    if (!from) return;
    const cell = cellAt(event);
    if (!cell || (cell.x === from.x && cell.y === from.y)) return;
    const value = strokeValue.current;
    const line = lineCells(from.x, from.y, cell.x, cell.y);
    dispatch({
      type: "draw",
      fn: (s) => line.reduce((acc, [x, y]) => paint(acc, x, y, value), s),
    });
    lastCell.current = cell;
  };

  const endStroke = () => {
    if (!lastCell.current) return;
    lastCell.current = null;
    dispatch({ type: "end" });
  };

  const onCanvasKey = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const move = moves[event.key];
    const at = cursor ?? { x: 0, y: 0 };
    if (move) {
      event.preventDefault();
      setCursor({
        x: Math.max(0, Math.min(sprite.width - 1, at.x + move[0])),
        y: Math.max(0, Math.min(sprite.height - 1, at.y + move[1])),
      });
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      applyTool(at.x, at.y, tool === "eraser" ? 0 : activeInk, false);
      setCursor(at);
    }
  };

  // Shortcuts, except while typing in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      } else if (mod && key === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
      } else if (!mod && !event.altKey) {
        const found = TOOLS.find((t) => t.key === key);
        if (found) setTool(found.id);
        else if (/^[1-9]$/.test(key) && Number(key) <= sprite.palette.length) setInk(Number(key));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sprite.palette.length]);

  const load = (next: Sprite) => {
    apply(() => next);
    setInk(1);
    setCursor(null);
  };

  const saveCurrent = () => {
    const next = [sprite, ...saved.filter((s) => s.name !== sprite.name)];
    setSaved(next);
    writeStored(SAVED_KEY, next);
  };

  const deleteSaved = (name: string) => {
    const next = saved.filter((s) => s.name !== name);
    setSaved(next);
    writeStored(SAVED_KEY, next);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(toCode(sprite));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setImportText(toCode(sprite));
    }
  };

  const importSprite = () => {
    // "Copy code" heads the map with "// <name>: <w> × <h> cells".
    const named = /^\s*\/\/\s*(.+?):\s*\d+\s*×/m.exec(importText)?.[1];
    const parsed = parseCode(importText, named ?? "Imported");
    if (!parsed) {
      setImportError('No string map found: paste rows like "..##.." in quotes.');
      return;
    }
    setImportError(null);
    load(parsed);
  };

  const filled = sprite.cells.filter((v) => v !== 0).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        {/* Toolbar */}
        <div role="toolbar" aria-label="Drawing tools" className="mb-4 flex flex-wrap gap-2">
          <div className="flex gap-1">
            {TOOLS.map((t) => (
              <ToolButton
                key={t.id}
                label={t.label}
                icon={t.icon}
                pressed={tool === t.id}
                onClick={() => setTool(t.id)}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <ToolButton
              label="Undo (Ctrl+Z)"
              icon={Undo2}
              disabled={history.past.length === 0}
              onClick={() => dispatch({ type: "undo" })}
            />
            <ToolButton
              label="Redo (Ctrl+Shift+Z)"
              icon={Redo2}
              disabled={history.future.length === 0}
              onClick={() => dispatch({ type: "redo" })}
            />
          </div>
          <div className="flex gap-1">
            <ToolButton
              label="Flip horizontally"
              icon={FlipHorizontal2}
              onClick={() => apply(flipX)}
            />
            <ToolButton
              label="Move drawing left"
              icon={ArrowLeft}
              onClick={() => apply((s) => shift(s, -1, 0))}
            />
            <ToolButton
              label="Move drawing up"
              icon={ArrowUp}
              onClick={() => apply((s) => shift(s, 0, -1))}
            />
            <ToolButton
              label="Move drawing down"
              icon={ArrowDown}
              onClick={() => apply((s) => shift(s, 0, 1))}
            />
            <ToolButton
              label="Move drawing right"
              icon={ArrowRight}
              onClick={() => apply((s) => shift(s, 1, 0))}
            />
          </div>
          <div className="flex gap-1">
            <ToolButton
              label="Trim the canvas to the drawing"
              icon={Crop}
              onClick={() => apply((s) => trim(s))}
            />
            <ToolButton
              label="Clear the canvas"
              icon={Trash2}
              onClick={() => apply((s) => ({ ...s, cells: s.cells.map(() => 0) }))}
            />
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={wrapRef}
          className="flex min-h-80 items-center justify-center overflow-hidden border border-line bg-surface p-4 select-none"
        >
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="img"
            aria-label={`${sprite.name}: ${sprite.width} by ${sprite.height} cells, ${filled} filled. Arrow keys move the cursor, Space applies the ${tool}.`}
            className={cn(
              "block touch-none",
              tool === "picker" ? "cursor-copy" : "cursor-crosshair",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onLostPointerCapture={endStroke}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={onCanvasKey}
            onBlur={() => setCursor(null)}
          />
        </div>
        <p className="mt-3 text-body text-muted">
          {sprite.width} × {sprite.height} cells · {filled} filled · left button draws, right button
          erases
        </p>

        {/* Variants */}
        <section aria-labelledby="dino-variants" className="mt-12">
          <h2 id="dino-variants" className="font-display text-h3 font-semibold">
            Variants
          </h2>
          <p className="mt-2 text-body text-muted">
            Load one to edit it. Loading is one undo step, so nothing on the canvas is lost.
          </p>
          {GROUPS.map((group) => (
            <div key={group}>
              <h3 className="mt-8 text-eyebrow font-medium text-muted uppercase">{group}</h3>
              <ul
                className={cn(
                  "mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3",
                  group === GROUPS[0] && "xl:grid-cols-4",
                )}
              >
                {VARIANTS.filter((v) => v.group === group).map((v) => (
                  <li key={v.id} className="bg-bg">
                    <VariantTile sprite={v.sprite} note={v.note} onLoad={() => load(v.sprite)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {saved.length > 0 || lastDraft ? (
            <>
              <h3 className="mt-10 text-eyebrow font-medium text-muted uppercase">
                Saved in this browser
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 xl:grid-cols-4">
                {lastDraft ? (
                  <li className="bg-bg">
                    <VariantTile
                      sprite={lastDraft}
                      note="Last draft, from your previous visit"
                      onLoad={() => load(lastDraft)}
                    />
                  </li>
                ) : null}
                {saved.map((s) => (
                  <li key={s.name} className="relative bg-bg">
                    <VariantTile sprite={s} note="Saved" onLoad={() => load(s)} />
                    <button
                      type="button"
                      onClick={() => deleteSaved(s.name)}
                      aria-label={`Delete ${s.name}`}
                      title={`Delete ${s.name}`}
                      className="absolute top-2 right-2 z-10 inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-green"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>

      {/* Side panels */}
      <div className="flex flex-col gap-4">
        <Panel title="Name" id="dino-name">
          <input
            aria-labelledby="dino-name"
            value={sprite.name}
            onChange={(event) => apply((s) => ({ ...s, name: event.target.value }), "name")}
            className="h-11 w-full border border-line bg-bg px-3 text-body text-text"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <ToolButton label="Save in this browser" icon={Save} onClick={saveCurrent}>
              Save
            </ToolButton>
          </div>
        </Panel>

        <Panel title="Colours" id="dino-colours">
          <ul className="flex flex-wrap gap-2">
            {sprite.palette.map((color, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setInk(i + 1)}
                  aria-pressed={activeInk === i + 1}
                  aria-label={`Colour ${i + 1} (${INK_CHARS[i]}): ${color}`}
                  title={`${i + 1} · "${INK_CHARS[i]}" · ${color}`}
                  className={cn(
                    "flex size-11 items-center justify-center border transition-colors",
                    activeInk === i + 1 ? "border-green" : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="size-7" style={{ backgroundColor: color }} />
                </button>
              </li>
            ))}
            <li>
              <ToolButton
                label="Add a colour"
                icon={Plus}
                disabled={sprite.palette.length >= INK_CHARS.length}
                onClick={() => {
                  const unused = BRAND_COLORS.find((c) => !sprite.palette.includes(c.hex));
                  apply((s) => ({ ...s, palette: [...s.palette, unused?.hex ?? "#f5f5f5"] }));
                  setInk(sprite.palette.length + 1);
                }}
              />
            </li>
          </ul>

          {sprite.palette.length > 0 ? (
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-body text-muted">
                Colour {activeInk} changes every cell drawn in it.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="color"
                  aria-label={`Colour ${activeInk}`}
                  value={sprite.palette[activeInk - 1]}
                  onChange={(event) =>
                    apply(
                      (s) => ({
                        ...s,
                        palette: s.palette.map((c, i) =>
                          i === activeInk - 1 ? event.target.value : c,
                        ),
                      }),
                      `colour-${activeInk}`,
                    )
                  }
                  className="h-11 w-14 cursor-pointer border border-line bg-bg p-1"
                />
                <ToolButton
                  label={`Remove colour ${activeInk} (its cells are erased)`}
                  icon={Trash2}
                  disabled={sprite.palette.length <= 1}
                  onClick={() => {
                    apply((s) => removeColor(s, activeInk - 1));
                    setInk(Math.max(1, activeInk - 1));
                  }}
                />
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Brand colours">
                {BRAND_COLORS.map((c) => (
                  <li key={c.hex}>
                    <button
                      type="button"
                      title={`${c.name} ${c.hex}`}
                      aria-label={`Set colour ${activeInk} to ${c.name}`}
                      onClick={() =>
                        apply((s) => ({
                          ...s,
                          palette: s.palette.map((p, i) => (i === activeInk - 1 ? c.hex : p)),
                        }))
                      }
                      className="flex size-11 items-center justify-center border border-line transition-colors hover:border-line-strong"
                    >
                      <span className="size-6" style={{ backgroundColor: c.hex }} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>

        <Panel title="Canvas size" id="dino-size">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {EDGES.map((edge) => (
              <li key={edge} className="flex items-center justify-between gap-2">
                <span className="text-body text-muted capitalize">{edge}</span>
                <span className="flex gap-1">
                  <ToolButton
                    label={`Remove a ${edge === "top" || edge === "bottom" ? "row" : "column"} at the ${edge}`}
                    icon={Minus}
                    onClick={() => apply((s) => resize(s, { [edge]: -1 }))}
                  />
                  <ToolButton
                    label={`Add a ${edge === "top" || edge === "bottom" ? "row" : "column"} at the ${edge}`}
                    icon={Plus}
                    onClick={() => apply((s) => resize(s, { [edge]: 1 }))}
                  />
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <ToolButton
              label="Add one empty cell on every side"
              onClick={() => apply((s) => resize(s, { top: 1, right: 1, bottom: 1, left: 1 }))}
            >
              Pad all sides
            </ToolButton>
          </div>
        </Panel>

        <Panel title="Export" id="dino-export">
          <div className="flex items-center justify-center border border-line bg-bg p-4">
            <SpriteSvg sprite={sprite} className="h-24 w-auto max-w-full" />
          </div>
          <label className="mt-4 flex items-center justify-between gap-3 text-body text-muted">
            PNG size
            <select
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="h-11 border border-line bg-bg px-2 text-text"
            >
              {[1, 2, 4, 8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n}× ({sprite.width * n} × {sprite.height * n})
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ToolButton
              label="Download PNG"
              icon={Download}
              onClick={async () => {
                const blob = await toPngBlob(sprite, scale);
                if (blob) download(blob, `${fileSlug(sprite.name)}.png`);
              }}
            >
              PNG
            </ToolButton>
            <ToolButton
              label="Download SVG"
              icon={Download}
              onClick={() =>
                download(
                  new Blob([toSvg(sprite, scale)], { type: "image/svg+xml" }),
                  `${fileSlug(sprite.name)}.svg`,
                )
              }
            >
              SVG
            </ToolButton>
            <ToolButton
              label="Copy as a string map for the codebase"
              icon={copied ? Check : Copy}
              onClick={copyCode}
              className="col-span-2"
            >
              {copied ? "Copied" : "Copy code"}
            </ToolButton>
          </div>
        </Panel>

        <Panel title="Import" id="dino-import">
          <textarea
            aria-labelledby="dino-import"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={'"..##..",\n".####.",'}
            className="w-full border border-line bg-bg p-3 font-mono text-[0.8125rem] leading-snug text-text"
          />
          {importError ? (
            <p role="alert" className="mt-2 text-body text-muted">
              {importError}
            </p>
          ) : null}
          <div className="mt-3">
            <ToolButton label="Load the pasted map onto the canvas" onClick={importSprite}>
              Load map
            </ToolButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function VariantTile({
  sprite,
  note,
  onLoad,
}: {
  sprite: Sprite;
  note: string;
  onLoad: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onLoad}
      className="group hover-corners flex h-full w-full flex-col gap-4 p-4 text-left transition-colors hover:bg-surface-2"
    >
      <span className="flex h-24 items-center justify-center">
        <SpriteSvg sprite={sprite} className="max-h-full w-auto max-w-full" />
      </span>
      <span>
        <span className="block text-body font-medium text-text transition-colors group-hover:text-green">
          {sprite.name}
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-snug text-muted">{note}</span>
      </span>
    </button>
  );
}
