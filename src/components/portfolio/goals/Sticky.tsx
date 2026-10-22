"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { BOARD, GOAL_COLORS, GOAL_MAX, type Goal, type GoalColor } from "@/lib/portfolio/shared";
import { cn } from "@/lib/utils";

export type Note = Goal & { key: string; mine: boolean; pending?: boolean };

export const NOTE_FILL: Record<GoalColor, string> = {
  lime: "var(--lime)",
  green: "var(--green)",
  cyan: "var(--cyan)",
  blue: "var(--blue)",
  pink: "var(--pink)",
  white: "var(--text)",
};

/** Shorter goals read bigger, the way FigJam fits text to its stickies. */
function textSize(text: string) {
  return text.length <= 40 ? "text-xl" : text.length <= 90 ? "text-base" : "text-sm";
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);
const MAX_X = BOARD.width - BOARD.note;
const MAX_Y = BOARD.height - BOARD.note;

/**
 * One sticky note. Your own (and, for the host, any note) can be selected: a press selects it,
 * a drag moves it (pointer captured, so it keeps up with a fast hand), a double click or the
 * pencil edits it, and the bar above it recolours or removes it. Everyone else's are plain.
 * Flat fills, no shadow: the board has no raised surfaces.
 */
export function Sticky({
  note,
  canDelete,
  selected,
  editing,
  onSelect,
  onEdit,
  onMove,
  onChange,
  onRemove,
}: {
  note: Note;
  canDelete: boolean;
  selected: boolean;
  editing: boolean;
  onSelect: (key: string | null) => void;
  onEdit: (key: string | null) => void;
  onMove: (note: Note, x: number, y: number) => void;
  onChange: (note: Note, patch: Partial<Pick<Goal, "color" | "text">>) => void;
  onRemove: (note: Note) => void;
}) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(
    null,
  );
  const editable = note.mine && !note.pending;
  const x = drag?.x ?? note.x;
  const y = drag?.y ?? note.y;

  function down(event: PointerEvent<HTMLDivElement>) {
    if (!(editable || canDelete) || editing || event.button !== 0) return;
    event.stopPropagation();
    onSelect(note.key);
    if (!editable) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { px: event.clientX, py: event.clientY, x: note.x, y: note.y, moved: false };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const from = start.current;
    if (!from) return;
    const dx = event.clientX - from.px;
    const dy = event.clientY - from.py;
    if (!from.moved && Math.hypot(dx, dy) < 3) return;
    from.moved = true;
    setDrag({ x: clamp(from.x + dx, MAX_X), y: clamp(from.y + dy, MAX_Y) });
  }

  function up() {
    if (start.current?.moved && drag) onMove(note, drag.x, drag.y);
    start.current = null;
    setDrag(null);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    if (editing || event.target !== event.currentTarget) return;
    if ((event.key === "Delete" || event.key === "Backspace") && (editable || canDelete)) {
      event.preventDefault();
      onRemove(note);
      return;
    }
    if (!editable) return;
    if (event.key === "Enter") {
      event.preventDefault();
      onEdit(note.key);
      return;
    }
    const step = event.shiftKey ? 40 : 8;
    const nudge: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const [dx, dy] = nudge[event.key] ?? [0, 0];
    if (dx || dy) {
      event.preventDefault();
      onMove(note, clamp(note.x + dx, MAX_X), clamp(note.y + dy, MAX_Y));
    }
  }

  const label = note.text || "Empty note";
  return (
    <div
      className={cn("absolute", (selected || drag) && "z-10")}
      style={{ left: x, top: y, width: BOARD.note, height: BOARD.note }}
    >
      {selected && !drag && (editable || canDelete) ? (
        <div
          className={cn(
            "absolute flex items-center gap-1 border border-line-strong bg-bg p-1",
            // Centred over the note (it fits a phone's view that way), but kept inside the board:
            // below a note at the top edge, flush with the note at either side.
            note.y < 56 ? "top-full mt-3" : "bottom-full mb-3",
            note.x < 60
              ? "left-0"
              : note.x > BOARD.width - BOARD.note - 60
                ? "right-0"
                : "left-1/2 -translate-x-1/2",
          )}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {editable
            ? GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color.replace(/^./, (c) => c.toUpperCase())}
                  aria-pressed={note.color === color}
                  onClick={() => onChange(note, { color })}
                  className="grid size-8 place-items-center"
                >
                  <span
                    className={cn(
                      "size-5 transition-[outline-color]",
                      note.color === color
                        ? "outline-2 outline-offset-2 outline-text"
                        : "outline-2 outline-offset-2 outline-transparent",
                    )}
                    style={{ background: NOTE_FILL[color] }}
                  />
                </button>
              ))
            : null}
          {editable ? (
            <button
              type="button"
              aria-label="Edit text"
              onClick={() => onEdit(note.key)}
              className="grid size-8 place-items-center text-muted transition-colors hover:text-text"
            >
              <Pencil aria-hidden className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Remove note"
            onClick={() => onRemove(note)}
            className="grid size-8 place-items-center text-muted transition-colors hover:text-text"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}

      <div
        role={editable || canDelete ? "button" : undefined}
        tabIndex={editable || canDelete ? 0 : undefined}
        aria-label={
          editable
            ? `Your note: ${label}. Enter to edit, arrow keys to move, Delete to remove.`
            : canDelete
              ? `Note: ${label}. Delete to remove.`
              : undefined
        }
        aria-pressed={editable || canDelete ? selected : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={() => editable && onEdit(note.key)}
        onFocus={() => (editable || canDelete) && onSelect(note.key)}
        onKeyDown={key}
        className={cn(
          "relative size-full p-4 text-bg",
          editable && !editing && "cursor-grab touch-none active:cursor-grabbing",
          selected && "outline-2 outline-offset-4 outline-text",
          note.pending && "opacity-60",
        )}
        style={{ background: NOTE_FILL[note.color] }}
      >
        {editing ? (
          <NoteEditor
            initial={note.text}
            onDone={(text) => {
              onEdit(null);
              if (text !== note.text) onChange(note, { text });
            }}
          />
        ) : (
          <p
            className={cn(
              "size-full overflow-hidden leading-snug font-medium break-words whitespace-pre-wrap select-none",
              textSize(note.text),
            )}
          >
            {note.text ||
              (editable ? <span className="opacity-50">Double-click to write</span> : null)}
          </p>
        )}
      </div>
    </div>
  );
}

function NoteEditor({ initial, onDone }: { initial: string; onDone: (text: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <>
      <label className="sr-only" htmlFor="goal-editor">
        Your goal for tonight
      </label>
      <textarea
        id="goal-editor"
        autoFocus
        value={text}
        maxLength={GOAL_MAX}
        placeholder="One goal for tonight…"
        onChange={(event) => setText(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => onDone(text.trim())}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(
          "size-full resize-none bg-transparent leading-snug font-medium text-bg placeholder:text-bg/50 focus-visible:outline-none",
          textSize(text),
        )}
      />
      <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-bg/60">
        {text.length}/{GOAL_MAX}
      </span>
    </>
  );
}
