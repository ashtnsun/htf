"use client";

import { useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { hero } from "@content/hero";
import { HeroShell, heroFrameClass } from "@/components/home/heroes/HeroShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/utils";

type Char = { ch: string; line: number; accent: boolean };

/** Flattens the headline lines into characters, keeping the *accent* markers as a flag. */
function buildChars(lines: readonly string[]): Char[] {
  const out: Char[] = [];
  lines.forEach((line, index) => {
    let accent = false;
    for (const ch of line) {
      if (ch === "*") {
        accent = !accent;
        continue;
      }
      out.push({ ch, line: index, accent });
    }
  });
  return out;
}

const CHARS = buildChars(hero.lines);
const TOTAL = CHARS.length;
const LAST_LINE = hero.lines.length - 1;

/** Milliseconds before the character at `index` appears. */
function delayFor(index: number): number {
  if (index === 0) return 500;
  const prev = CHARS[index - 1]!;
  const next = CHARS[index]!;
  if (prev.line !== next.line) return 420;
  if (next.ch === " ") return 90;
  return 46 + ((index * 7) % 5) * 9;
}

/**
 * "Typewriter": the statement types itself in, character by character, behind a green block
 * cursor that keeps blinking once the sentence is complete. The full text is in the DOM from
 * the first paint (untyped characters are only transparent), so assistive tech, search and
 * the no-JavaScript render all get the whole headline. Replay re-types it; under
 * prefers-reduced-motion the sentence is simply there.
 */
export function TypewriterHero() {
  const reduce = useReducedMotion() ?? false;
  const [typed, setTyped] = useState(0);
  const shown = reduce ? TOTAL : typed;
  const done = shown >= TOTAL;
  const cursorLine = done ? LAST_LINE : CHARS[shown]!.line;

  useEffect(() => {
    if (reduce || typed >= TOTAL) return;
    const id = window.setTimeout(() => setTyped((t) => t + 1), delayFor(typed));
    return () => window.clearTimeout(id);
  }, [typed, reduce]);

  return (
    <HeroShell glow>
      <noscript>
        <style>{`[data-typed] [data-ch]{opacity:1!important}`}</style>
      </noscript>
      <div className={heroFrameClass}>
        <div className="animate-fade-in">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </div>

        <div className="my-auto py-16 md:py-20">
          <h1
            id="hero-title"
            data-typed=""
            className="font-display text-display-fluid font-medium text-text"
          >
            {hero.lines.map((_, line) => (
              <span key={line} className="block">
                {CHARS.map((c, i) =>
                  c.line === line ? (
                    <span
                      key={i}
                      data-ch=""
                      className={cn(c.accent && "text-green", i >= shown && "opacity-0")}
                    >
                      {c.ch}
                    </span>
                  ) : null,
                )}
                {cursorLine === line ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "ml-[0.08em] inline-block h-[0.82em] w-[0.5em] translate-y-[0.06em] bg-green align-baseline",
                      done && "anim-blink",
                    )}
                  />
                ) : null}
              </span>
            ))}
          </h1>

          {reduce ? null : (
            <button
              type="button"
              onClick={() => setTyped(0)}
              className={cn(
                "mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-green",
                !done && "invisible",
              )}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Replay
            </button>
          )}
        </div>
      </div>
    </HeroShell>
  );
}
