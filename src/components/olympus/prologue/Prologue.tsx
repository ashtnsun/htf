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
  darkGod,
  ember,
  family,
  frieze,
  godSolo,
  GODS,
  laptop,
  oracleFire,
  pantheon,
  storm,
  summitPoint,
  temple,
} from "@/components/olympus/prologue/formations";
import { Score } from "@/components/olympus/prologue/score";
import { CellStage, type Dot, type MorphOptions } from "@/components/olympus/prologue/stage";
import { Media } from "@/components/ui/Media";

export type PrologueExec = { name: string; photo: string };

type ViewProps = { phase: number; execs: readonly PrologueExec[]; address: string };

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
};

type Beat = {
  /** Letterbox bars with the Greek key: narrative scenes yes, the practical setup no. */
  bars: boolean;
  glow?: "summit" | "fire";
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

function Address({ address, shown }: { address: string; shown?: number }) {
  const path = "/olympus";
  const host = address.slice(0, -path.length);
  const n = shown ?? address.length;
  // Fits one line on the 1920 × 1080 slide however long the deployed host is.
  const size = Math.min(104, 1480 / (address.length * 0.6));
  return (
    <span
      className="pro-address"
      style={{ fontSize: `calc(var(--u) * ${size.toFixed(1)})` } as React.CSSProperties}
    >
      {/* The whole address takes its room from the start, so typing never shifts it. */}
      <span aria-hidden="true" className="pro-address-ghost">
        {address}
      </span>
      <span aria-hidden="true" className="pro-address-typed">
        <span>{host.slice(0, n)}</span>
        <span className="text-green">{path.slice(0, Math.max(0, n - host.length))}</span>
        {n < address.length ? <span className="pro-caret" /> : null}
      </span>
      <span className="sr-only">{address}</span>
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

const WORD_DEMO = "YOUR WORD";

const BEATS: readonly Beat[] = [
  // ------------------------------------------------------------ standby: one flame in the dark
  {
    bars: false,
    cue: ({ stage, score, place }) => {
      score.drone(0);
      place(ember(stage.grid), { duration: 1000, spread: 200, exit: "center" });
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
      score.drone(0.4, 6);
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
      score.drone(0.45);
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

  // ------------------------------------------------------------ the roll call, then all nine
  {
    bars: true,
    view: ({ phase }) => {
      if (phase === 0) return null;
      if (phase <= GODS.length) {
        const side = phase % 2 ? "right" : "left";
        return (
          <div key={phase} className="pro-god" data-side={side}>
            <p className="pro-god-name">{GODS[phase - 1]}</p>
          </div>
        );
      }
      return (
        <div className="pro-pair">
          <In d={700} className="pro-head">
            Nine gods.
          </In>
          <In d={1500} className="pro-head">
            Nine families.
          </In>
        </div>
      );
    },
    cue: ({ stage, score, instant, at, flash, setPhase }) => {
      const STEP = 1050;
      const OPEN = 300;
      score.drone(0.5);
      if (instant) {
        stage.set(pantheon(stage.grid));
        setPhase(GODS.length + 1);
        return;
      }
      GODS.forEach((god, i) => {
        at(OPEN + i * STEP, () => {
          // Odd calls stand left with the name on the right; the last god gets the bolt.
          const side = i % 2 ? "right" : "left";
          stage.morph(godSolo(stage.grid, god, side), {
            duration: 420,
            spread: 160,
            burn: "#f5f5f5",
          });
          setPhase(i + 1);
          stage.shake(160, 1);
          score.hit(0.7);
          if (i === GODS.length - 1) {
            at(400, () => {
              stage.strike(Math.floor(stage.cols * 0.27), 0, stage.rows);
              flash(0.7, 500);
              score.thunder();
            });
          }
        });
      });
      at(OPEN + GODS.length * STEP + 900, () => {
        stage.morph(pantheon(stage.grid), { duration: 1500, spread: 700, order: "up" });
        setPhase(GODS.length + 1);
      });
    },
  },

  // ------------------------------------------------------------ the execs
  {
    bars: true,
    view: ({ execs }) => (
      <div className="pro-execs-scene">
        <In d={200} className="pro-voice">
          Nine execs have taken their names.
        </In>
        <ExecRow execs={execs} />
        <In d={2300} className="pro-voice">
          They are not saying who took which.
        </In>
      </div>
    ),
    cue: ({ stage, score, place }) => {
      score.drone(0.3);
      const g = stage.grid;
      place(
        frieze(
          g,
          Math.round(g.rows / 2 - stage.units(190)),
          Math.round(g.rows / 2 + stage.units(142)),
        ),
        {
          duration: 1200,
          spread: 400,
          exit: "fall",
        },
      );
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
      const g = stage.grid;
      place(
        frieze(
          g,
          Math.round(g.rows / 2 - stage.units(190)),
          Math.round(g.rows / 2 + stage.units(142)),
        ),
      );
      if (instant) {
        setPhase(DARK);
        return;
      }
      score.drone(0.35);
      for (const { card, ms } of ROULETTE) {
        at(900 + ms, () => {
          setPhase(card + 1);
          score.tick(1500, 0.16);
        });
      }
      at(900 + ROULETTE_END, () => {
        setPhase(DARK);
        flash(0.25, 400);
        stage.shake(240, 1);
        score.hit(1);
      });
    },
  },

  // ------------------------------------------------------------ the chain
  {
    bars: true,
    glow: undefined,
    view: () => (
      <div className="pro-chain">
        <In d={300} className="pro-head">
          You have to earn it.
        </In>
        <div className="pro-chain-under">
          <In d={3000} className="pro-voice">
            A chain of trials. Each answer is the key to the next.
          </In>
          <In d={5400} className="pro-voice pro-voice-strong">
            No trial explains itself.
          </In>
        </div>
      </div>
    ),
    cue: ({ stage, score, instant, at, place }) => {
      score.drone(0.35);
      place(chain(stage.grid), { order: "given", duration: 1000, spread: 4200, burn: "#03c652" });
      if (instant) return;
      for (let i = 0; i < 9; i += 1) at(900 + i * 470, () => score.tick(420, 0.3));
      at(5300, () => score.stone());
    },
  },

  // ------------------------------------------------------------ setup I: the laptop
  {
    bars: false,
    view: () => (
      <div className="pro-step">
        <In className="pro-step-num">I</In>
        <In d={200} className="pro-head">
          One family.
          <br />
          One laptop.
        </In>
        <In d={900} className="pro-body">
          Choose it now. Everyone else gathers round it.
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, instant }) => {
      score.drone(0.2);
      place(laptop(stage.grid), { duration: 1000, spread: 500, burn: "#03c652" });
      if (!instant) at(900, () => score.stone());
    },
  },

  // ------------------------------------------------------------ setup II: the address
  {
    bars: false,
    view: ({ address, phase }) => (
      <div className="pro-url">
        <div className="pro-url-head">
          <In className="pro-step-num">II</In>
          <In d={150} className="pro-head">
            Go to the HTF site.
          </In>
        </div>
        <div className="pro-url-field">
          <Address address={address} shown={phase} />
        </div>
        <In d={1800} className="pro-body">
          Type the whole address. No link on the site will take you there.
        </In>
      </div>
    ),
    cue: ({ stage, score, instant, at, setPhase, place }) => {
      place(browser(stage.grid), { duration: 900, spread: 350, burn: "#03c652" });
      const length = location.host.length + "/olympus".length;
      if (instant) {
        setPhase(length);
        return;
      }
      at(600, () => score.stone());
      for (let i = 1; i <= length; i += 1) {
        at(800 + i * 42, () => {
          setPhase(i);
          score.tick(1900, 0.07);
        });
      }
    },
  },

  // ------------------------------------------------------------ setup III: the column
  {
    bars: false,
    view: () => (
      <div className="pro-below">
        <div className="pro-url-head">
          <In className="pro-step-num">III</In>
          <In d={150} className="pro-head">
            Click your group&apos;s column.
          </In>
        </div>
        <In d={800} className="pro-body">
          Nine columns, numbered I to IX. Yours waits for you.
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, instant }) => {
      place(temple(stage.grid, { sweep: true, top: 16 }), {
        duration: 1100,
        spread: 900,
        order: "up",
        burn: "#03c652",
      });
      if (!instant) at(1100, () => score.stone());
    },
  },

  // ------------------------------------------------------------ setup IV: the camera, the tab
  {
    bars: false,
    view: () => (
      <div className="pro-step">
        <In className="pro-step-num">IV</In>
        <In d={200} className="pro-head">
          Allow the camera.
        </In>
        <In d={900} className="pro-body">
          The first trial wants every face in the frame.
        </In>
        <In d={1500} className="pro-body">
          Then keep that tab. A refresh is fine. A new tab starts you over.
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, flash, instant }) => {
      place(family(stage.grid), { duration: 1000, spread: 500, burn: "#03c652" });
      if (instant) return;
      at(800, () => score.stone());
      at(2300, () => {
        flash(0.35, 240);
        score.shutter();
      });
    },
  },

  // ------------------------------------------------------------ the Oracle
  {
    bars: true,
    glow: "fire",
    view: () => (
      <div className="pro-oracle">
        <In d={500} className="pro-oracle-side pro-voice">
          The last trial leaves you one word.
        </In>
        <In d={2600} className="pro-oracle-side pro-voice pro-voice-strong">
          Bring it here. To this laptop, in front of everyone.
        </In>
      </div>
    ),
    cue: ({ stage, score, at, place, instant }) => {
      score.drone(0.5, 3);
      place(oracleFire(stage.grid), { duration: 1400, spread: 1000, order: "up", burn: "#03c652" });
      if (!instant) at(1200, () => score.stone());
    },
  },

  // ------------------------------------------------------------ the demonstration: the word
  {
    bars: true,
    glow: "fire",
    view: ({ phase }) => (
      <div className="pro-demo">
        <In className="pro-voice">Type your word.</In>
        <span className="pro-demo-word">
          {WORD_DEMO.slice(0, phase)}
          {phase < WORD_DEMO.length ? <span className="pro-caret" /> : null}
        </span>
        <span className="pro-demo-button">
          <span>REVEAL</span>
        </span>
      </div>
    ),
    cue: ({ stage, score, instant, at, setPhase, place }) => {
      place(oracleFire(stage.grid, { big: false, low: true }), { duration: 1100, spread: 400 });
      if (instant) {
        setPhase(WORD_DEMO.length);
        return;
      }
      for (let i = 1; i <= WORD_DEMO.length; i += 1) {
        at(900 + i * 150, () => {
          setPhase(i);
          score.tick(900, 0.14);
        });
      }
    },
  },

  // ------------------------------------------------------------ the demonstration: the hold
  {
    bars: true,
    view: ({ phase }) =>
      phase === 0 ? (
        <div className="pro-demo">
          <p className="pro-voice">Hold REVEAL.</p>
          <span className="pro-demo-word">{WORD_DEMO}</span>
          <span className="pro-demo-button" data-holding>
            <span>REVEAL</span>
            <span aria-hidden="true" className="pro-demo-fill">
              REVEAL
            </span>
          </span>
        </div>
      ) : (
        <div className="pro-after">
          <In d={900} className="pro-head">
            Your god. Your exec. Your family.
          </In>
          <In d={2200} className="pro-voice">
            On this screen, for the whole room.
          </In>
        </div>
      ),
    cue: ({ stage, score, instant, at, setPhase, flash }) => {
      const HOLD = 3600;
      if (instant) {
        stage.set(darkGod(stage.grid));
        setPhase(1);
        return;
      }
      score.rise(HOLD / 1000);
      stage.morph(storm(stage.grid), {
        duration: 1700,
        spread: 1700,
        order: "in",
        burn: "#f5f5f5",
      });
      at(1800, () => stage.shake(1800, 1));
      at(HOLD, () => {
        stage.set(darkGod(stage.grid));
        flash(1, 1100);
        stage.shake(500, 2);
        score.thunder();
        setPhase(1);
      });
    },
  },

  // ------------------------------------------------------------ the last slide: the way in
  {
    bars: true,
    glow: "summit",
    view: ({ address }) => (
      <div className="pro-final">
        <h2 className="pro-in pro-final-title">Who is your god?</h2>
        <In d={1000} className="pro-final-address">
          <Address address={address} />
        </In>
      </div>
    ),
    cue: ({ stage, score, place, instant }) => {
      score.drone(0.4);
      const { dots, rock } = climb(stage.grid, { lit: true });
      place(dots, { duration: 1600, spread: 900, order: "up", burn: "#03c652" });
      stage.backdrop(rock, { instant });
    },
  },
];

/**
 * The Prologue (/prologue): the slides for the family reveal, presented from the site by the exec
 * at the projectors. Each press plays one beat. The picture is one field of cells that reshapes
 * itself from scene to scene (stage.ts, formations.ts); the type sits over it, scaled like a
 * slide (`--u` is one pixel of a 1920 × 1080 slide). It starts on a small flame so it can sit on
 * the projectors while the room settles, and its last press collapses everything back into that
 * flame and lands on /oracle, ready for the first family's word.
 *
 * Nothing here says which exec is which god: the gods and execs are never listed in the same
 * order as each other or as the families, and only the gods' shapes are drawn.
 *
 * Next: click, Space, Enter, → or Page Down (what clickers send). Back: ← or Page Up, which lands
 * on the finished beat. F full screen, S sound, B black. The place is kept in the URL's hash, so a
 * refresh resumes it.
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
  const [address] = useState(() => `${location.host}/olympus`);
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

  // The stage, for the life of the page.
  useEffect(() => {
    const made = new CellStage(canvasRef.current!, reduce);
    setStage(made);
    return () => {
      made.stop();
      setStage(null);
    };
  }, [reduce]);

  // The sound stops with the page.
  useEffect(() => () => score.close(), [score]);

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
      BEATS[index]!.cue({
        stage,
        score,
        instant: now,
        at,
        flash,
        setPhase: (value) => setProgress({ of: index, value }),
        place: (dots, options) => (now ? stage.set(dots) : stage.morph(dots, options)),
      });
    });
    history.replaceState(null, "", index ? `#${index}` : location.pathname);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stage, index, instant, reduce, resized, leaving, score, flash]);

  const leave = useCallback(() => {
    if (leaving) return;
    if (reduce || !stage) {
      router.push("/oracle");
      return;
    }
    setLeaving(true);
    score.rise(1.4);
    stage.morph(ember(stage.grid), {
      duration: 1000,
      spread: 400,
      exit: "center",
      burn: "#03c652",
    });
    window.setTimeout(() => {
      flash(1, 900);
      score.drone(0, 0.3);
      score.hit(1);
      stage.set([]);
      router.push("/oracle");
    }, 1400);
  }, [flash, leaving, reduce, router, score, stage]);

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
      data-bars={beat.bars || undefined}
      data-glow={leaving ? undefined : beat.glow}
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
        {leaving || !beat.view ? null : beat.view({ phase, execs, address })}
      </div>

      {index === 0 && !leaving ? (
        <p className="pro-hint">
          Space or click to go on. Left arrow to go back. F for full screen. S for sound. B for
          black.
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
