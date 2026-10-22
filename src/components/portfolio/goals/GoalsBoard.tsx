"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createGoal, deleteGoal, updateGoal } from "@/app/portfolio/actions";
import { BOARD, GOAL_COLORS, type Goal, type GoalColor } from "@/lib/portfolio/shared";
import { NOTE_FILL, Sticky, type Note } from "./Sticky";

const clampX = (x: number) => Math.round(Math.min(Math.max(x, 0), BOARD.width - BOARD.note));
const clampY = (y: number) => Math.round(Math.min(Math.max(y, 0), BOARD.height - BOARD.note));

/**
 * The goals board, after FigJam: a dotted board you scroll or drag around, and a dock of
 * stickies at the bottom. Drag one onto the board (or press it to drop one in the middle of
 * the view), write a goal, move it, recolour it. Notes are everyone's to read and only their
 * author's to change (the server checks the owner cookie on every write); the host can remove
 * any. Everyone's board stays current through Supabase Realtime.
 */
export function GoalsBoard({
  initial,
  realtime,
  host,
}: {
  initial: (Goal & { mine: boolean })[];
  realtime: { url: string; anonKey: string } | null;
  host: boolean;
}) {
  const [notes, setNotes] = useState<Note[]>(() => initial.map((g) => ({ ...g, key: g.id })));
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ color: GoalColor; x: number; y: number } | null>(null);
  const [status, setStatus] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const pan = useRef<{ px: number; py: number; left: number; top: number } | null>(null);
  const placed = useRef(0);
  const dock = useRef<{ color: GoalColor; px: number; py: number; moved: boolean } | null>(null);

  // Open on the middle of the board, where pressed stickies land.
  useEffect(() => {
    const view = viewport.current;
    if (!view) return;
    view.scrollLeft = (view.scrollWidth - view.clientWidth) / 2;
    view.scrollTop = (view.scrollHeight - view.clientHeight) / 2;
  }, []);

  const realtimeUrl = realtime?.url;
  const realtimeKey = realtime?.anonKey;
  useEffect(() => {
    if (!realtimeUrl || !realtimeKey) return;
    let stop = () => {};
    let cancelled = false;
    // Loaded on this page only, after first paint.
    void import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;
      const client = createClient(realtimeUrl, realtimeKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const channel = client
        .channel("goals")
        .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            setNotes((all) => all.filter((n) => n.id !== id));
            return;
          }
          const { id, x, y, color, text, updated_at } = payload.new as Goal;
          setNotes((all) => {
            // This browser is the source of truth for its own notes.
            if (all.some((n) => n.id === id && n.mine)) return all;
            const rest = all.filter((n) => n.id !== id);
            return [...rest, { id, x, y, color, text, updated_at, key: id, mine: false }];
          });
        })
        .subscribe();
      stop = () => void client.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [realtimeUrl, realtimeKey]);

  function failed() {
    setStatus("That didn't save. Check your connection and try again.");
  }

  async function place(color: GoalColor, x: number, y: number) {
    const key = `new-${++placed.current}`;
    const position = { x: clampX(x), y: clampY(y) };
    setStatus("");
    setNotes((all) => [
      ...all,
      { ...position, id: key, key, color, text: "", updated_at: "", mine: true, pending: true },
    ]);
    const goal = await createGoal({ ...position, color });
    if (!goal) {
      setNotes((all) => all.filter((n) => n.key !== key));
      failed();
      return;
    }
    setNotes((all) => [
      ...all.filter((n) => n.key !== key && n.id !== goal.id),
      { ...goal, key: goal.id, mine: true },
    ]);
    setSelected(goal.id);
    setEditing(goal.id);
  }

  /**
   * A press drops the note in the middle of the view, on the nearest spot inside the view that
   * nothing covers; when the view is full (a phone), it cascades down and right from the middle.
   */
  function placeInView(color: GoalColor) {
    const view = viewport.current;
    if (!view) return;
    const x = clampX(view.scrollLeft + view.clientWidth / 2 - BOARD.note / 2);
    const y = clampY(view.scrollTop + view.clientHeight / 2 - BOARD.note / 2);
    const step = BOARD.note + 16;
    const fits = (cx: number, cy: number) =>
      cx >= view.scrollLeft &&
      cy >= view.scrollTop &&
      cx + BOARD.note <= view.scrollLeft + view.clientWidth &&
      cy + BOARD.note <= view.scrollTop + view.clientHeight;
    const free = (cx: number, cy: number) =>
      notes.every((n) => Math.abs(n.x - cx) >= BOARD.note || Math.abs(n.y - cy) >= BOARD.note);
    for (let ring = 0; ring < 5; ring++) {
      for (let i = -ring; i <= ring; i++) {
        for (let j = -ring; j <= ring; j++) {
          if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
          const cx = x + i * step;
          const cy = y + j * step;
          if ((ring === 0 || fits(cx, cy)) && free(cx, cy)) return place(color, cx, cy);
        }
      }
    }
    const stacked = notes.filter((n) => Math.abs(n.x - x) < 120 && Math.abs(n.y - y) < 120);
    place(color, x + (stacked.length % 5) * 24, y + (stacked.length % 5) * 24);
  }

  /** Local first, then the server; the touched note moves to the top of the pile. */
  function patch(note: Note, change: Partial<Pick<Goal, "x" | "y" | "color" | "text">>) {
    setNotes((all) => [...all.filter((n) => n.key !== note.key), { ...note, ...change }]);
    void updateGoal(note.id, change).then((ok) => (ok ? setStatus("") : failed()));
  }

  function remove(note: Note) {
    setNotes((all) => all.filter((n) => n.key !== note.key));
    setSelected(null);
    void deleteGoal(note.id).then((ok) => (ok ? setStatus("") : failed()));
  }

  function panStart(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    setSelected(null);
    // Touch scrolls the board natively.
    if (event.pointerType === "touch" || event.button !== 0 || !viewport.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { scrollLeft: left, scrollTop: top } = viewport.current;
    pan.current = { px: event.clientX, py: event.clientY, left, top };
  }

  function panMove(event: PointerEvent<HTMLDivElement>) {
    const from = pan.current;
    if (!from || !viewport.current) return;
    viewport.current.scrollLeft = from.left - (event.clientX - from.px);
    viewport.current.scrollTop = from.top - (event.clientY - from.py);
  }

  function dockDown(event: PointerEvent<HTMLButtonElement>, color: GoalColor) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dock.current = { color, px: event.clientX, py: event.clientY, moved: false };
  }

  function dockMove(event: PointerEvent<HTMLButtonElement>) {
    const from = dock.current;
    if (!from) return;
    if (!from.moved && Math.hypot(event.clientX - from.px, event.clientY - from.py) < 4) return;
    from.moved = true;
    setGhost({ color: from.color, x: event.clientX, y: event.clientY });
  }

  function dockUp(event: PointerEvent<HTMLButtonElement>) {
    const from = dock.current;
    dock.current = null;
    setGhost(null);
    if (!from || !viewport.current || !world.current) return;
    if (!from.moved) {
      placeInView(from.color);
      return;
    }
    const view = viewport.current.getBoundingClientRect();
    const inside =
      event.clientX >= view.left &&
      event.clientX <= view.right &&
      event.clientY >= view.top &&
      event.clientY <= view.bottom;
    if (!inside) return;
    const board = world.current.getBoundingClientRect();
    place(
      from.color,
      event.clientX - board.left - BOARD.note / 2,
      event.clientY - board.top - BOARD.note / 2,
    );
  }

  const count = notes.filter((n) => !n.pending).length;
  return (
    <div className="flex flex-col lg:h-dvh">
      <header className="px-6 pt-4 pb-6 lg:px-10 lg:pt-10">
        <h1 className="text-lg font-medium text-text">Goals</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Drag a sticky onto the board and write one goal for tonight. Everyone sees every note;
          only you can move or change yours.{" "}
          <span className="text-text">
            {count} {count === 1 ? "goal" : "goals"}
          </span>
        </p>
        <p role="status" className="mt-2 text-sm text-cyan empty:hidden">
          {status}
        </p>
      </header>

      <div className="relative h-[70dvh] border-t border-line lg:h-auto lg:min-h-0 lg:flex-1">
        <div
          ref={viewport}
          role="region"
          aria-label="Goals board"
          tabIndex={-1}
          onKeyDown={(event) => event.key === "Escape" && setSelected(null)}
          className="size-full overflow-auto overscroll-contain"
        >
          <div
            ref={world}
            onPointerDown={panStart}
            onPointerMove={panMove}
            onPointerUp={() => (pan.current = null)}
            onPointerCancel={() => (pan.current = null)}
            className="relative cursor-grab active:cursor-grabbing"
            style={{
              width: BOARD.width,
              height: BOARD.height,
              backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {notes.map((note) => (
              <Sticky
                key={note.key}
                note={note}
                canDelete={host && !note.pending}
                selected={selected === note.key}
                editing={editing === note.key}
                onSelect={setSelected}
                onEdit={setEditing}
                onMove={(n, x, y) => patch(n, { x, y })}
                onChange={(n, change) => (change.text === "" ? remove(n) : patch(n, change))}
                onRemove={remove}
              />
            ))}
          </div>
        </div>

        {/* Pinned to the screen on phones, where the board runs past the fold. */}
        <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4 border border-line-strong bg-bg px-4 py-3 lg:absolute">
          <ul className="flex items-center gap-2" aria-label="Stickies">
            {GOAL_COLORS.map((color) => (
              <li key={color}>
                <button
                  type="button"
                  aria-label={`Add a ${color} sticky`}
                  onPointerDown={(event) => dockDown(event, color)}
                  onPointerMove={dockMove}
                  onPointerUp={dockUp}
                  onPointerCancel={() => {
                    dock.current = null;
                    setGhost(null);
                  }}
                  // Keyboard presses arrive as clicks with no pointer behind them (detail 0).
                  onClick={(event) => event.detail === 0 && placeInView(color)}
                  className="grid size-11 cursor-grab touch-none place-items-center active:cursor-grabbing"
                >
                  <span className="size-7" style={{ background: NOTE_FILL[color] }} />
                </button>
              </li>
            ))}
          </ul>
          <p className="hidden text-sm whitespace-nowrap text-muted sm:block">
            Drag a sticky onto the board
          </p>
        </div>
      </div>

      {ghost ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 opacity-90"
          style={{
            left: ghost.x - BOARD.note / 2,
            top: ghost.y - BOARD.note / 2,
            width: BOARD.note,
            height: BOARD.note,
            background: NOTE_FILL[ghost.color],
          }}
        />
      ) : null}
    </div>
  );
}
