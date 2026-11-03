"use client";

import "@/components/olympus/prologue/prologue.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Meander } from "@/components/olympus/Meander";
import {
  browser,
  chain,
  climb,
  CLIMB_FROM,
  ember,
  frieze,
  laptop,
  oracleFire,
  summitPoint,
  temple,
} from "@/components/olympus/prologue/formations";
import { Score } from "@/components/olympus/prologue/score";
import { CellStage, type Dot, type MorphOptions } from "@/components/olympus/prologue/stage";
import { Media } from "@/components/ui/Media";

export type PrologueExec = { name: string; photo: string };

type ViewProps = { phase: number; execs: readonly PrologueExec[] };

/** What a beat's cue can do: the picture, the sound, timers cancelled when the beat is left. */
type Cue = {
  stage: CellStage;
  score: Score;
  /** Landed on this beat by a step back, a resume or reduced motion: draw the end state, no timers. */
  instant: boolean;
  at: (ms: number, fn: () => void) => void;
  flash: (strength?: number, ms?: number) => void;
  setPhase: (phase: number) => void;
  /** Morphs, or sets when instant. */
  place: (dots: readonly Dot[], options?: MorphOptions) => void;
  /** Leaves the deck for /oracle without a press (only the last beat does). */
  leave: () => void;
};

type Beat = {
  /** Letterbox bars with the Greek key: narrative scenes yes, the practical setup no. */
  bars: boolean;
  glow?: "summit" | "fire" | "ember";
  view?: (props: ViewProps) => ReactNode;
  cue: (cue: Cue) => void;
};

/** One line of type, rising in after `d` milliseconds. */
function In({
  d = 0,
  className,
  children,
}: {
  d?: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <p className={`pro-in ${className}`} style={{ "--d": `${d}ms` } as React.CSSProperties}>
      {children}
    </p>
  );
}

/** Where the families start: the home page, whose Olympus section is up on the day. */
const SITE = "htfpurdue.org";

function Address({ shown = SITE.length }: { shown?: number }) {
  return (
    <span className="pro-address">
      {/* The whole address takes its room from the start, so typing never shifts it. */}
      <span aria-hidden="true" className="pro-address-ghost">
        {SITE}
      </span>
      <span aria-hidden="true" className="pro-address-typed">
        {SITE.slice(0, shown)}
        {shown < SITE.length ? <span className="pro-caret" /> : null}
      </span>
      <span className="sr-only">{SITE}</span>
    </span>
  );
}

const CARD_W = 186;
const CARD_H = 248;

function ExecRow({
  execs,
  lit,
  dim = false,
  settled = false,
}: {
  execs: readonly PrologueExec[];
  /** Index of the card the roulette is on. */
  lit?: number;
  dim?: boolean;
  settled?: boolean;
}) {
  return (
    <ul
      className="pro-execs"
      data-dim={dim || undefined}
      data-settled={settled || undefined}
      aria-label="The nine execs"
    >
      {execs.map(({ name, photo }, i) => (
        <li
          key={name}
          className="pro-exec"
          data-lit={lit === i || undefined}
          style={{ "--d": `${200 + i * 110}ms` } as React.CSSProperties}
        >
          <span className="pro-exec-frame">
            <Media src={photo} alt="" fill sizes="240px" priority className="object-cover" />
          </span>
          <span className="pro-exec-name">{name}</span>
        </li>
      ))}
    </ul>
  );
}

/** The roulette's stops, slowing down: a scrambled walk through the nine (4 and 9 share no factor). */
const ROULETTE = Array.from({ length: 22 }, (_, i) => ({
  card: (i * 4 + 2) % 9,
  ms: Math.round(70 * i + 3.4 * i * i),
}));
const ROULETTE_END = ROULETTE.at(-1)!.ms + 640;
const DARK = 100;

/** Slide pixels from the middle of the screen to the top of each Greek key band over the execs. */
const BAND_ABOVE = 236;
const BAND_BELOW = 188;

function execBands(stage: CellStage) {
  const { rows } = stage.grid;
  return frieze(
    stage.grid,
    Math.round(rows / 2 - stage.units(BAND_ABOVE)),
    Math.round(rows / 2 + stage.units(BAND_BELOW)),
  );
}

/** Milliseconds over which the chain is forged, first link to fire. */
const FORGE = 4200;
/** How long the Oracle's line holds before the fire takes the screen. */
const ORACLE_HOLD = 7000;
/** Milliseconds from the fire being let go to /oracle starting to come up. */
const LEAVE = 1100;
/** How long /oracle takes to come up once it has rendered. */
const ARRIVE = 1100;

/**
 * One dark sheet over the route change. The site's page transition crossfades two full-screen
 * snapshots, the one step of this ending that dropped frames, and here the old page is already
 * plain dark: so the sheet goes up (the screen does not change), the page transition is switched
 * off for this one change (`data-pro-leaving` in globals.css), and the sheet fades off the real
 * /oracle from the moment it has rendered, however long that took.
 */
let sheet: HTMLElement | null = null;

function raiseSheet() {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = "position:fixed;inset:0;z-index:100;background:var(--bg);pointer-events:none";
  document.body.append(el);
  document.documentElement.setAttribute("data-pro-leaving", "");
  sheet = el;
  // Should the route never arrive, the presenter must not be left in front of a blank screen.
  window.setTimeout(() => lowerSheet(el), 8000);
}

function lowerSheet(el = sheet) {
  if (!el || el !== sheet) return;
  sheet = null;
  document.documentElement.removeAttribute("data-pro-leaving");
  const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: ARRIVE,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards",
  });
  void fade.finished.finally(() => el.remove());
}

const BEATS: readonly Beat[] = [
  // ------------------------------------------------------------ standby: a fire in the dark
  {
    bars: false,
    glow: "ember",
    cue: ({ stage, score, instant, at, place }) => {
      score.wind(0);
      score.fire(0.8);
      const { dots, fire } = ember(stage.grid);
      place(dots, { duration: 1000, spread: 300, exit: "center" });
      if (instant) stage.fire(fire);
      else at(700, () => stage.fire(fire, { grow: 3200 }));
    },
  },

  // ------------------------------------------------------------ the mountain
  {
    bars: true,
    view: () => (
      <div className="pro-lines">
        <p className="pro-passing pro-voice" style={{ "--d": "600ms" } as React.CSSProperties}>
          Before the first commit.
        </p>
        <p className="pro-passing pro-voice" style={{ "--d": "3700ms" } as React.CSSProperties}>
          Before the first all-nighter.
        </p>
        <In d={9000} className="pro-voice pro-mountain-line">
          There was a mountain.
        </In>
      </div>
    ),
    cue: ({ stage, score, instant }) => {
      score.fire(0, 2);
      score.wind(0.9, 4);
      const { dots, rock } = climb(stage.grid);
      if (instant) {
        stage.set(dots);
        stage.backdrop(rock, { instant: true });
        return;
      }
      stage.morph(dots, { kindle: true, spread: 400, exit: "fall", duration: 2200 });
      stage.backdrop(rock);
      stage.pan(CLIMB_FROM, 0, 11500);
    },
  },

  // ------------------------------------------------------------ the strike, the title
  {
    bars: true,
    glow: "summit",
    view: ({ phase }) =>
      phase > 0 ? (
        <div className="pro-title-card">
          <div className="pro-logo pro-in" style={{ "--d": "1500ms" } as React.CSSProperties}>
            <Logo height={44} />
          </div>
          <h2 className="pro-title">Olympus</h2>
          <In d={1100} className="pro-voice">
            The family reveal
          </In>
        </div>
      ) : null,
    cue: ({ stage, score, instant, at, flash, setPhase }) => {
      const light = () => {
        const { dots, rock } = climb(stage.grid, { lit: true });
        stage.set(dots);
        stage.backdrop(rock, { instant: true });
      };
      score.fire(0);
      score.wind(0.3);
      if (instant) {
        light();
        setPhase(1);
        return;
      }
      at(120, () => flash(0.16, 260));
      at(1000, () => {
        light();
        const { x, y } = summitPoint(stage.grid);
        stage.strike(x, 0, y);
        stage.shake(600, 2);
        flash(1, 800);
        score.thunder();
        setPhase(1);
      });
    },
  },

  // ------------------------------------------------------------ the execs
  {
    bars: true,
    view: ({ execs }) => (
      <div className="pro-execs-scene">
        <In d={200} className="pro-voice">
          Nine execs have taken a god&apos;s name.
        </In>
        <ExecRow execs={execs} />
        <In d={2300} className="pro-voice">
          They are not saying who took which.
        </In>
      </div>
    ),
    cue: ({ stage, score, instant, at, place }) => {
      score.wind(0.4);
      place(execBands(stage), { duration: 1200, spread: 400, exit: "fall" });
      // A soft tick for each photo as it comes in (the delays in ExecRow).
      if (!instant) for (let i = 0; i < 9; i += 1) at(450 + i * 110, () => score.tick(900, 0.16));
    },
  },

  // ------------------------------------------------------------ the question
  {
    bars: true,
    view: ({ execs, phase }) => (
      <div className="pro-execs-scene">
        <In className="pro-voice">Your group belongs to one of them.</In>
        <ExecRow
          execs={execs}
          lit={phase > 0 && phase !== DARK ? phase - 1 : undefined}
          dim={phase === DARK}
          settled
        />
        <p className="pro-voice" aria-hidden="true">
          &nbsp;
        </p>
        {phase === DARK ? <h2 className="pro-question">Whose family are you in?</h2> : null}
      </div>
    ),
    cue: ({ stage, score, instant, at, setPhase, place, flash }) => {
      place(execBands(stage));
      if (instant) {
        setPhase(DARK);
        return;
      }
      for (const { card, ms } of ROULETTE) {
        at(900 + ms, () => {
          setPhase(card + 1);
          score.tick(2100, 0.26);
        });
      }
      at(900 + ROULETTE_END, () => {
        setPhase(DARK);
        flash(0.25, 400);
        stage.shake(240, 1);
        score.thud(1);
      });
    },
  },

  // ------------------------------------------------------------ the chain
  {
    bars: true,
    view: () => (
      <div className="pro-chain">
        <In d={300} className="pro-head">
          You have to earn it.
        </In>
        <div className="pro-chain-under">
          <In d={3000} className="pro-voice">
            Six trials. Each answer is the key to the next.
          </In>
        </div>
      </div>
    ),
    cue: ({ stage, score, instant, at, place, flash }) => {
      score.wind(0);
      const { dots, links, fire } = chain(stage.grid);
      place(dots, { order: "given", duration: 500, spread: FORGE, burn: "#03c652" });
      if (instant) {
        stage.fire(fire);
        score.fire(0.4);
        return;
      }
      // Each link lands on a hammer blow, then the fire catches at the end of the chain.
      links.forEach(({ x, y }, i) => {
        at(((i + 1) / (links.length + 1)) * FORGE + 520, () => {
          score.clang();
          stage.shake(130, 1);
          stage.sparks(x, y);
        });
      });
      at(FORGE + 520, () => {
        stage.fire(fire, { grow: 700 });
        score.whoosh(0.3, 1.4);
        score.fire(0.4);
        flash(0.12, 500);
      });
    },
  },

  // ------------------------------------------------------------ setup: the laptop
  {
    bars: false,
    view: () => (
      <div className="pro-step">
        <In d={200} className="pro-head">
          One family.
          <br />
          <span className="text-green">One laptop.</span>
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, instant }) => {
      score.fire(0);
      score.wind(0.3);
      place(laptop(stage.grid), { duration: 1000, spread: 500, burn: "#03c652" });
      if (!instant) at(900, () => score.stone());
    },
  },

  // ------------------------------------------------------------ setup: the site
  {
    bars: false,
    view: ({ phase }) => (
      <div className="pro-url">
        <In d={150} className="pro-head">
          Go to the HTF site.
        </In>
        <div className="pro-url-field">
          <Address shown={phase} />
        </div>
        <In d={2000} className="pro-body">
          Then scroll down to the Olympus section.
        </In>
      </div>
    ),
    cue: ({ stage, score, instant, at, setPhase, place }) => {
      score.wind(0.3);
      place(browser(stage.grid), { duration: 900, spread: 350, burn: "#03c652" });
      if (instant) {
        setPhase(SITE.length);
        return;
      }
      at(600, () => score.stone());
      for (let i = 1; i <= SITE.length; i += 1) {
        at(800 + i * 70, () => {
          setPhase(i);
          score.tick(2600, 0.2);
        });
      }
    },
  },

  // ------------------------------------------------------------ setup: the column
  {
    bars: false,
    view: () => (
      <div className="pro-below">
        <In d={150} className="pro-head">
          Click your group&apos;s column.
        </In>
        <In d={800} className="pro-body">
          Nine columns, numbered I to IX. Yours waits for you.
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, instant }) => {
      score.wind(0.3);
      place(temple(stage.grid, { sweep: true, top: 16 }), {
        duration: 1100,
        spread: 900,
        order: "up",
        burn: "#03c652",
      });
      if (!instant) at(1100, () => score.stone());
    },
  },

  // ------------------------------------------------------------ good luck, back on the summit
  {
    bars: true,
    glow: "summit",
    view: () => (
      <div className="pro-final">
        <h2 className="pro-in pro-final-title">Good luck.</h2>
        <In d={1000} className="pro-final-address">
          <Address />
        </In>
      </div>
    ),
    cue: ({ stage, score, place, instant }) => {
      score.wind(0.5);
      const { dots, rock } = climb(stage.grid, { lit: true });
      place(dots, { duration: 1600, spread: 900, order: "up", burn: "#03c652" });
      stage.backdrop(rock, { instant });
    },
  },

  // ------------------------------------------------------------ on to the Oracle, unprompted
  {
    bars: true,
    glow: "fire",
    view: () => (
      <div className="pro-oracle">
        <In d={1300} className="pro-head">
          Bring your final word to the <span className="text-green">Oracle.</span>
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, instant, leave }) => {
      score.wind(0.1);
      const { dots, fire } = oracleFire(stage.grid);
      place(dots, {
        duration: 1300,
        spread: 1000,
        order: "up",
        exit: "fall",
        burn: "#03c652",
      });
      if (instant) {
        stage.fire(fire);
        score.fire(0.8);
        return;
      }
      at(900, () => {
        stage.fire(fire, { grow: 1800 });
        score.whoosh(0.28, 1.6);
        score.fire(0.8, 2.5);
      });
      at(ORACLE_HOLD, leave);
    },
  },
];

/**
 * The Prologue (/prologue): the slides for the family reveal, presented from the site by the exec
 * at the projectors. Each press plays one beat. The picture is one field of cells that reshapes
 * itself from scene to scene (stage.ts, formations.ts); the type sits over it, scaled like a
 * slide (`--u` is one pixel of a 1920 × 1080 slide). It starts on a small flame so it can sit on
 * the projectors while the room settles. "Good luck" is the last press: the Oracle's fire rises and
 * says where the final word goes, then burns out, the scene lifting away and everything easing to
 * dark as /oracle comes up out of it, ready for the first family's word.
 *
 * It sets the families off and stops there: no god is named or drawn (nothing here imports their
 * sprites or content/olympus.ts), and no trial is explained.
 *
 * Next: click, Space, Enter, → or Page Down (what clickers send). Back: ← or Page Up, which lands
 * on the finished beat. F full screen, S mutes (the first press is what wakes the sound), B black.
 * The place is kept in the URL's hash, so a refresh resumes it.
 */
export function Prologue({ execs }: { execs: readonly PrologueExec[] }) {
  const router = useRouter();
  const reduce = useReducedMotionSafe();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<CellStage | null>(null);
  const [score] = useState(() => new Score());
  const [nav, setNav] = useState(() => {
    const n = Number(location.hash.slice(1));
    const index = Number.isInteger(n) && n > 0 && n < BEATS.length ? n : 0;
    return { index, instant: index > 0 };
  });
  // A beat's own progress; it belongs to the beat that set it, so the next never draws it.
  const [progress, setProgress] = useState({ of: -1, value: 0 });
  const phase = progress.of === nav.index ? progress.value : 0;
  const [leaving, setLeaving] = useState(false);
  const [black, setBlack] = useState(false);
  const [note, setNote] = useState("");
  const [resized, setResized] = useState(0);
  const { index, instant } = nav;
  const beat = BEATS[index]!;

  const flash = useCallback(
    (strength = 1, ms = 700) => {
      if (reduce) return;
      flashRef.current?.animate([{ opacity: strength }, { opacity: 0 }], {
        duration: ms,
        easing: "cubic-bezier(0.1, 0.7, 0.3, 1)",
      });
    },
    [reduce],
  );

  // Nothing cuts: the fire burns out, the scene lifts away as it all eases to dark (prologue.css,
  // `data-leaving`) and the sound falls with it, and /oracle comes up out of that dark.
  const leave = useCallback(() => {
    if (leaving) return;
    // The fire and the air fall away over /oracle.
    score.finale();
    if (reduce || !stage) {
      router.push("/oracle");
      return;
    }
    setLeaving(true);
    stage.morph([], { duration: LEAVE, spread: 300, exit: "rise" });
    window.setTimeout(() => {
      raiseSheet();
      router.push("/oracle");
    }, LEAVE);
  }, [leaving, reduce, router, score, stage]);

  // The stage, for the life of the page.
  useEffect(() => {
    const made = new CellStage(canvasRef.current!, reduce);
    setStage(made);
    return () => {
      made.stop();
      setStage(null);
    };
  }, [reduce]);

  // The sound stops with the page, and /oracle, having rendered, comes up from under the sheet.
  useEffect(
    () => () => {
      score.close();
      lowerSheet();
    },
    [score],
  );

  // On a resize the grid changes: redraw this beat as finished.
  useEffect(() => {
    const onResize = () => {
      stage?.resize();
      setNav((current) => ({ ...current, instant: true }));
      setResized((n) => n + 1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [stage]);

  // Each beat's cue. The first timer is what starts it, so Strict Mode's double effect plays once.
  useEffect(() => {
    if (!stage || leaving) return;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => void timers.push(window.setTimeout(fn, ms));
    const now = instant || reduce;
    at(0, () => {
      if (!now && index > 0) score.whoosh(0.14, 1);
      BEATS[index]!.cue({
        stage,
        score,
        instant: now,
        at,
        flash,
        setPhase: (value) => setProgress({ of: index, value }),
        place: (dots, options) => (now ? stage.set(dots) : stage.morph(dots, options)),
        leave,
      });
    });
    history.replaceState(null, "", index ? `#${index}` : location.pathname);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stage, index, instant, reduce, resized, leaving, score, flash, leave]);

  const go = useCallback(
    (delta: number) => {
      if (leaving) return;
      setBlack(false);
      if (delta > 0 && index === BEATS.length - 1) return leave();
      const to = Math.min(BEATS.length - 1, Math.max(0, index + delta));
      if (to !== index) setNav({ index: to, instant: delta < 0 });
    },
    [index, leave, leaving],
  );

  useEffect(() => {
    router.prefetch("/oracle");
  }, [router]);

  // A browser lets sound start on the first key or click, so that is what wakes it.
  useEffect(() => {
    const arm = () => score.arm();
    window.addEventListener("keydown", arm, { capture: true, once: true });
    window.addEventListener("pointerdown", arm, { capture: true, once: true });
    return () => {
      window.removeEventListener("keydown", arm, { capture: true });
      window.removeEventListener("pointerdown", arm, { capture: true });
    };
  }, [score]);

  // The keys, and the cursor hiding when it has been still for two seconds.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const key = event.key;
      if (key === "ArrowRight" || key === "PageDown" || key === " " || key === "Enter") {
        event.preventDefault();
        go(1);
      } else if (key === "ArrowLeft" || key === "PageUp" || key === "Backspace") {
        event.preventDefault();
        go(-1);
      } else if (key === "Home") {
        setNav({ index: 0, instant: true });
      } else if (key === "End") {
        setNav({ index: BEATS.length - 1, instant: true });
      } else if (key === "f" || key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      } else if (key === "b" || key === "B" || key === ".") {
        setBlack((on) => !on);
      } else if (key === "s" || key === "S") {
        setNote(score.toggle() ? "Sound on" : "Sound off");
      }
    };
    let idle = 0;
    const onMove = () => {
      rootRef.current?.removeAttribute("data-idle");
      window.clearTimeout(idle);
      idle = window.setTimeout(() => rootRef.current?.setAttribute("data-idle", ""), 2000);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(idle);
    };
  }, [go, score]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 1400);
    return () => window.clearTimeout(timer);
  }, [note]);

  return (
    <div
      ref={rootRef}
      className="pro-root"
      data-instant={instant || reduce || undefined}
      data-bars={(beat.bars && !leaving) || undefined}
      data-glow={leaving ? undefined : beat.glow}
      data-leaving={leaving || undefined}
      onClick={() => go(1)}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pro-canvas" />
      <div aria-hidden="true" className="pro-glow" />
      <div aria-hidden="true" className="pro-vignette" />

      <div aria-hidden="true" className="pro-bar pro-bar-top">
        <Meander cell={2} className="absolute inset-x-0 bottom-0 text-green-deep" />
      </div>
      <div aria-hidden="true" className="pro-bar pro-bar-bottom">
        <Meander cell={2} className="absolute inset-x-0 top-0 text-green-deep" />
      </div>

      <h1 className="sr-only">Olympus: the prologue to the family reveal</h1>
      <div key={index} className="pro-text" aria-live="polite">
        {beat.view?.({ phase, execs })}
      </div>

      {index === 0 && !leaving ? (
        <p className="pro-hint">
          Space or click to go on. Left arrow to go back. F for full screen. S to mute. B for black.
        </p>
      ) : null}

      {/* The controls for a keyboard or a screen reader; a press anywhere does the same. */}
      <button
        type="button"
        className="sr-only focus-visible:not-sr-only"
        onClick={(event) => {
          event.stopPropagation();
          go(1);
        }}
      >
        Next scene
      </button>
      <button
        type="button"
        className="sr-only focus-visible:not-sr-only"
        onClick={(event) => {
          event.stopPropagation();
          go(-1);
        }}
      >
        Previous scene
      </button>

      <div ref={flashRef} aria-hidden="true" className="pro-flash" />
      {black ? <div aria-hidden="true" className="pro-black" /> : null}
      {note ? (
        <p role="status" className="pro-note">
          {note}
        </p>
      ) : null}

      {/* Loaded up front, so the execs are there the moment their scene opens. */}
      <div aria-hidden="true" className="pro-preload">
        {execs.map(({ name, photo }) => (
          <Media
            key={name}
            src={photo}
            alt=""
            width={CARD_W}
            height={CARD_H}
            sizes="240px"
            priority
          />
        ))}
      </div>
    </div>
  );
}
