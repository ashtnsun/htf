"use client";

import "@/components/olympus/journey/journey.css";
import "@/components/olympus/crawl/crawl.css";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { carveStone, speakWord, takeWord } from "@/app/olympus/actions";
import { inscriptionKey, sentence, vigenere } from "@/components/olympus/journey/cipher";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { bronzeTexture, coinPicture, stoneTexture } from "@/components/olympus/crawl/art";
import type { Round } from "@/components/olympus/crawl/blackjack";
import { cosmeticById, type Look } from "@/components/olympus/crawl/cosmetics";
import { CrawlEngine, DROP, type WorldEvent } from "@/components/olympus/crawl/engine";
import { tombSound } from "@/components/olympus/crawl/sound";
import { loadSave, writeSave, type TombSave } from "@/components/olympus/crawl/save";
import { SwapTimer } from "@/components/olympus/crawl/SwapTimer";
import { Blackjack } from "@/components/olympus/crawl/trials/Blackjack";
import { DinoRun } from "@/components/olympus/crawl/trials/DinoRun";
import { Mirror } from "@/components/olympus/crawl/trials/Mirror";
import { MuralTrial } from "@/components/olympus/crawl/trials/MuralTrial";
import { RiddleTablet } from "@/components/olympus/crawl/trials/RiddleTablet";
import { SealDoor } from "@/components/olympus/crawl/trials/SealDoor";
import { TrialShell } from "@/components/olympus/crawl/trials/Shell";
import { StoneWheels } from "@/components/olympus/crawl/trials/StoneWheels";
import { WordGate } from "@/components/olympus/crawl/trials/WordGate";
import {
  CELL,
  CHEST_COINS,
  ROOM_LIST,
  ROOMS,
  type Room,
  type RoomId,
  type Target,
} from "@/components/olympus/crawl/world";
import { Finale } from "@/components/olympus/journey/Finale";
import { OFFLINE } from "@/components/olympus/journey/parts";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { whenPassageLifts } from "@/components/olympus/Passage";
import { roman } from "@/components/olympus/shared";

type Open = Exclude<Target, { kind: "note" | "item" | "chest" }>;

/** Milliseconds: the close-up fading out, and the camera coming back. */
const LEAVE = 240;
const RETURN = 620;
/** Milliseconds from the passage's cells starting to open to the world starting to move. */
const OPENING_BEAT = 500;
/** Milliseconds a solved close-up stays up, to be seen and read, before it lets go by itself. */
const HOLD = { stone: 3000 };
/** Milliseconds a hint stays beside the map; `crawl-hint` in crawl.css fades over the same length. */
const HINT_MS = 8000;
/** Milliseconds between tries at a call nobody is waiting on a button for. */
const RETRY_MS = 3000;

const LABELS: Record<Open["kind"], string> = {
  tablet: "A riddle",
  mural: "The mural",
  gate: "The mask",
  stone: "The mechanism",
  door: "The great door",
  altar: "The altar",
  mirror: "The mirror",
  arcade: "The arcade machine",
  blackjack: "The blackjack machine",
};

/**
 * A family's tomb: the family reveal, walked as a game. A T-rex in a hat falls through the
 * roof into the Mural; the doors open once the family has stood before it, and from there every
 * trial is open, with nothing that says which comes first. The canvas (engine.ts) is the world;
 * pressing E on something closes the camera in on it and its close-up opens over the world
 * (trials/*). When a trial is solved the camera comes back and the world has changed, and the big
 * changes get a moment: the camera holds, the bars come in, the controls wait.
 *
 * The chain itself holds the order, checked on the server (app/olympus/actions.ts): the five
 * riddles fill the mask's crown, its word and the family's names carve the mechanism's plate, the
 * plate says where the letter is, the letter breaks the seal, and the seal shows the square the
 * fires have been counting on since the first step. Pressing the fires' word out on that floor
 * opens the great door by itself. The Sanctum behind it lights up as it is walked into; a chest at
 * its side takes five coins, the altar rises through the floor, and it forges a new word, the one for
 * the Oracle (reveal.ts).
 *
 * Every puzzle and riddle pays a coin. Coins buy clothes from the shop (worn at either mirror) and
 * feed the two machines in the den; none of that ever touches the chain. Once the photo has named them, a clock under the map says
 * whose turn it is and when to pass the controls on, name by name.
 */
export function Crawl({
  family,
  riddles,
  signal,
}: {
  family: number;
  riddles: string[];
  signal: [number, number][];
}) {
  const reduce = useReducedMotionSafe();
  const [save, setSave] = useState(() => loadSave(family, riddles.length));
  const [trial, setTrial] = useState<Open | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [bark, setBark] = useState<{ text: string; id: number } | null>(null);
  const [title, setTitle] = useState<{ text: string; id: number } | null>(null);
  const [room, setRoom] = useState<RoomId>(save.place?.room ?? "mural");
  const [stamped, setStamped] = useState("");
  const [moved, setMoved] = useState(!!save.place);
  const [muted, setMuted] = useState(() => !tombSound.on);
  const [cine, setCine] = useState(false);
  // The word is being forged at the altar, or is held there waiting for the family.
  const [forging, setForging] = useState(false);
  const [holding, setHolding] = useState(false);
  // The seal has just broken and its clue is up: the square stays down until that is closed.
  const [sealOpen, setSealOpen] = useState(false);
  // The pause menu is up: the world, the clock and the sound have all stopped.
  const [halted, setHalted] = useState(false);
  const [coinPop, setCoinPop] = useState(0);
  const [bjRound, setBjRound] = useState<Round | null>(null);
  const [coinSrc, setCoinSrc] = useState("");
  const [score] = useState(() => tombSound);
  // Where this visit began: React's double mount in dev must not count as a return.
  const [opening] = useState(save);
  // A first visit falls in with the screen to itself; the HUD arrives with the landing.
  const [falling, setFalling] = useState(
    () => !save.place && !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CrawlEngine | null>(null);
  const latest = useRef(save);
  const closing = useRef(false);
  const pendingEvent = useRef<WorldEvent | null>(null);
  const openKind = useRef<Open["kind"] | null>(null);
  const openTablet = useRef<number | null>(null);
  const settleTimer = useRef(0);
  const lastPressed = useRef("");
  const dotRef = useRef<SVGGElement>(null);

  const patch = useCallback(
    (p: Partial<TombSave> | ((s: TombSave) => Partial<TombSave>)) => {
      const change = typeof p === "function" ? p(latest.current) : p;
      const next = { ...latest.current, ...change };
      latest.current = next;
      setSave(next);
      writeSave(family, next);
    },
    [family],
  );

  /** Coins in hand; a positive amount sounds and pops the purse. */
  const addCoins = useCallback(
    (n: number) => {
      if (!n) return;
      patch((s) => ({ coins: Math.max(0, s.coins + n) }));
      if (n > 0) {
        score.coin();
        setCoinPop((p) => p + 1);
      }
    },
    [patch, score],
  );

  const buy = useCallback(
    (id: string) => {
      const item = cosmeticById(id);
      const s = latest.current;
      if (!item || s.owned.includes(id)) return;
      if (s.coins < item.price) {
        score.thud();
        setBark((b) => ({ text: "Not enough coin.", id: (b?.id ?? 0) + 1 }));
        return;
      }
      // On at once: the newest purchase goes straight on the dinosaur.
      patch({
        coins: s.coins - item.price,
        owned: [...s.owned, id],
        look: { ...s.look, [item.slot]: id },
      });
      score.buy();
    },
    [patch, score],
  );

  const say = useCallback(
    (text: string) => {
      score.talk();
      setBark((b) => ({ text, id: (b?.id ?? 0) + 1 }));
    },
    [score],
  );

  const closeTrial = useCallback(
    (event?: WorldEvent) => {
      if (closing.current) return;
      closing.current = true;
      score.menu(false);
      window.clearTimeout(settleTimer.current);
      openKind.current = null;
      openTablet.current = null;
      const engine = engineRef.current;
      const settled = event ?? pendingEvent.current;
      pendingEvent.current = null;
      setLeaving(true);
      const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(
        () => {
          setTrial(null);
          setLeaving(false);
          setHolding(false);
          setSealOpen(false);
          engine?.wake();
          engine?.releaseLook();
          if (worldRef.current) delete worldRef.current.dataset.zoom;
          if (settled) engine?.play(settled);
          rootRef.current?.focus();
          window.setTimeout(
            () => {
              closing.current = false;
              engine?.resume();
            },
            instant ? 0 : RETURN,
          );
        },
        instant ? 0 : LEAVE,
      );
    },
    [score],
  );

  const showTrial = useCallback(
    (target: Open) => {
      const engine = engineRef.current;
      if (!engine) return;
      const s = latest.current;
      // The mural lines itself up under its frame instead, once the frame exists (`fitMural`).
      if (worldRef.current && target.kind !== "mural") {
        const at = engine.focus(target);
        worldRef.current.style.removeProperty("--zoom");
        worldRef.current.style.transformOrigin = `${at.x * 100}% ${at.y * 100}%`;
        worldRef.current.dataset.zoom = "";
      }
      setBark(null);
      engine.pause();
      if (target.kind === "mural") {
        engine.faceMural();
        // The camera and the face finder need the machine: once settled, the world burns slowly.
        if (!s.photo) {
          window.setTimeout(() => {
            if (openKind.current === "mural") engine.pause(true);
          }, 1000);
        }
      }
      score.menu(true);
      openKind.current = target.kind;
      openTablet.current = target.kind === "tablet" ? target.index : null;
      setTrial(target);
    },
    [score],
  );

  /**
   * The altar, the first time: the server gives up the word, and the world forges it. The font is
   * loaded first because the letters are cut from it on a canvas. Under reduced motion the word is
   * just shown.
   */
  const forgeWord = useCallback(
    (target: Open) => {
      const engine = engineRef.current;
      const { seal, doorWord } = latest.current;
      if (!engine || !seal || !doorWord) return;
      engine.pause();
      const face = rootRef.current?.querySelector(".font-olympus");
      const font = face ? getComputedStyle(face).fontFamily : "serif";
      void Promise.all([
        takeWord(family, seal, doorWord),
        document.fonts.load(`600 48px ${font}`).catch(() => []),
      ])
        .then(([word]) => {
          engine.resume();
          if (!word) return say(OFFLINE);
          patch({ finalWord: word });
          engine.setFlags({ final: word });
          if (engine.revealWord(word, font)) setForging(true);
          else showTrial(target);
        })
        .catch(() => {
          engine.resume();
          say(OFFLINE);
        });
    },
    [family, patch, say, showTrial],
  );

  /** One coin into the chest at the side of the Sanctum; the last one raises the altar. */
  const giveChestCoin = useCallback(() => {
    const s = latest.current;
    if (s.coins < 1) {
      score.thud();
      setBark((b) => ({ text: "It wants a coin, and you have none.", id: (b?.id ?? 0) + 1 }));
      return;
    }
    const count = s.chestCoins + 1;
    patch({ coins: s.coins - 1, chestCoins: count });
    score.coin();
    engineRef.current?.chestCoin(count);
    if (count >= CHEST_COINS) engineRef.current?.raiseAltar();
  }, [patch, score]);

  const openTrial = useCallback(
    (target: Target) => {
      if (!engineRef.current || closing.current) return;
      const s = latest.current;
      if (target.kind === "note") return say(target.text);
      if (target.kind === "item") return buy(target.id);
      if (target.kind === "gate") {
        if (s.word) return say("It has heard you.");
        const empty = s.solved.filter((answer) => !answer).length;
        if (empty) {
          return say(
            empty === riddles.length
              ? "Five sockets, all of them empty."
              : `${roman(empty)} ${empty === 1 ? "socket is" : "sockets are"} still empty.`,
          );
        }
      }
      if (target.kind === "chest") return giveChestCoin();
      if (target.kind === "altar" && !s.finalWord) return forgeWord(target);
      showTrial(target);
    },
    [buy, forgeWord, giveChestCoin, riddles.length, say, showTrial],
  );

  /**
   * Moves the camera so the mural's picture lands exactly under the frame on screen: the scale that
   * makes their widths match, and the one origin that scale leaves the frame's middle fixed on.
   */
  const fitMural = useCallback((frame: DOMRect) => {
    const world = worldRef.current;
    const engine = engineRef.current;
    if (!world || !engine) return;
    const m = engine.muralRect();
    let k = frame.width / m.w;
    if (Math.abs(k - 1) < 0.01) k = 1.01;
    const origin = (from: number, to: number) => (k * from - to) / (k - 1);
    const x = origin(m.x + m.w / 2, frame.x + frame.width / 2);
    const y = origin(m.y + m.h / 2, frame.y + frame.height / 2);
    world.style.transformOrigin = `${x}px ${y}px`;
    world.style.setProperty("--zoom", String(k));
    world.dataset.zoom = "";
    rootRef.current?.style.setProperty("--stone", `${m.stone * k}px`);
  }, []);

  /** A trial solved after a delay: it may have been stepped away from in the meantime. */
  const settle = useCallback(
    (kind: Open["kind"], event: WorldEvent) => {
      if (openKind.current === kind) closeTrial(event);
      else engineRef.current?.play(event);
    },
    [closeTrial],
  );

  /** Solved, with something to read: the close-up holds a moment, then lets go by itself. */
  const settleAfter = useCallback(
    (kind: Open["kind"], event: WorldEvent, ms: number) => {
      if (openKind.current !== kind) return engineRef.current?.play(event);
      pendingEvent.current = event;
      settleTimer.current = window.setTimeout(() => closeTrial(), ms);
    },
    [closeTrial],
  );

  // The engine calls these; they always see the latest closures.
  /**
   * Letters pressed on the floor. The server is asked after every press, so the door opens the
   * moment the word is whole; nothing answers for a wrong one, so length gives nothing away.
   */
  const pressed = useCallback(
    (letters: string) => {
      setStamped(letters);
      lastPressed.current = letters;
      const { seal, doorWord } = latest.current;
      if (!seal || doorWord || letters.length < 3) return;
      const ask = () =>
        speakWord(family, seal, letters)
          .then((spoken) => {
            if (!spoken || latest.current.doorWord) return;
            patch({ doorWord: spoken });
            addCoins(1);
            settle(openKind.current ?? "door", { kind: "door" });
            window.setTimeout(() => engineRef.current?.clearStamps(), 3200);
          })
          .catch(() => {
            // Lost on the way, a right word would look like a wrong one: ask again while it stands.
            if (lastPressed.current !== letters) return;
            say(OFFLINE);
            window.setTimeout(() => {
              if (lastPressed.current === letters) void ask();
            }, RETRY_MS);
          });
      void ask();
    },
    [addCoins, family, patch, say, settle],
  );

  const takeDenCoin = useCallback(() => {
    patch({ denCoin: false });
    addCoins(1);
  }, [addCoins, patch]);

  const handlers = useRef({ openTrial, patch, pressed, takeDenCoin });
  useEffect(() => {
    handlers.current = { openTrial, patch, pressed, takeDenCoin };
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const start = opening;
    score.enter("tomb");
    const engine = new CrawlEngine(
      canvas,
      signal,
      {
        onPrompt: setPrompt,
        onInteract: (target) => handlers.current.openTrial(target),
        onRoom: (id, x, y) => {
          setRoom(id);
          const seen = latest.current.visited.includes(id);
          // The Sanctum says its name once it has lit up, not in the dark.
          if (!seen && id !== "sanctum") {
            setTitle((t) => ({ text: ROOMS[id].title, id: (t?.id ?? 0) + 1 }));
          }
          handlers.current.patch((s) => ({
            place: { room: id, x, y },
            visited: seen ? s.visited : [...s.visited, id],
            // The den leaves a coin out the first time, and for anyone who walks in with none, so
            // its machines can always be tried. One left lying stays until it is picked up.
            denCoin: s.denCoin || (id === "den" && (!seen || s.coins === 0)),
          }));
        },
        onStamp: (letters) => handlers.current.pressed(letters),
        onFirstMove: () => setMoved(true),
        onLanded: () => {
          setFalling(false);
          score.introLand();
          // Its name was said behind the passage's card, so say it again for the room to hear.
          setTitle((t) => ({ text: ROOMS.mural.title, id: (t?.id ?? 0) + 1 }));
        },
        onCine: (on, wide) => {
          const world = worldRef.current;
          if (!world) return;
          setCine(on);
          if (!on) setForging(false);
          if (on && !wide) {
            // The engine has the subject in the middle of the canvas, so this closes in on it.
            world.style.transformOrigin = "50% 50%";
            world.dataset.cine = "";
          } else if (world.dataset.cine != null) {
            // Back out at the camera's pace, so the zoom and the pan stay one move.
            delete world.dataset.cine;
            world.dataset.settling = "";
            window.setTimeout(() => delete world.dataset.settling, 1200);
          }
        },
        onKindled: () => setTitle((t) => ({ text: ROOMS.sanctum.title, id: (t?.id ?? 0) + 1 })),
        onDenCoin: () => handlers.current.takeDenCoin(),
        onWordHeld: () => {
          pendingEvent.current = { kind: "carve" };
          openKind.current = "altar";
          setHolding(true);
          setTrial({ kind: "altar" });
        },
        onPlace: (x, y) => {
          dotRef.current?.setAttribute("transform", `translate(${Math.round(x)} ${Math.round(y)})`);
        },
      },
      score,
      {
        pictured: start.names.length > 0,
        look: start.look,
        owned: start.owned,
        photo: null,
        solved: start.solved.map(Boolean),
        word: start.word,
        carved: !!start.carved,
        stoneRead: start.stoneRead,
        square: start.square,
        open: !!start.doorWord,
        final: start.finalWord,
        kindled: start.visited.includes("sanctum"),
        denCoin: start.denCoin,
        chest: start.chestCoins,
      },
      start.place,
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    engineRef.current = engine;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __crawl: CrawlEngine }).__crawl = engine;
    }
    engine.start();
    // Behind the passage's card the world waits, so its opening is seen.
    let beat = 0;
    const cancel = whenPassageLifts(() => {
      engine.wake();
      beat = window.setTimeout(() => {
        if (!openKind.current) engine.resume();
        if (!start.place) score.introFall(DROP);
      }, OPENING_BEAT);
    });
    if (cancel) {
      engine.pause(true);
      // The column's click counts as the gesture audio asks for, and starting it costs a stall
      // that only goes unseen here, under the card.
      score.arm();
    }
    score.armIfAllowed();
    // Under reduced motion there is no fall to land from, but the tomb still answers.
    if (!start.place && matchMedia("(prefers-reduced-motion: reduce)").matches) score.introLand();
    // Remounted with a close-up still open (a hot reload in dev): the new world waits behind it too.
    if (openKind.current) engine.pause();
    return () => {
      cancel?.();
      window.clearTimeout(beat);
      engine.stop();
      engineRef.current = null;
      score.closeSoon();
    };
  }, [opening, score, signal]);

  useEffect(() => {
    engineRef.current?.setReduce(reduce);
  }, [reduce]);

  // The world follows the save.
  useEffect(() => {
    engineRef.current?.setFlags({
      pictured: save.names.length > 0,
      look: save.look,
      owned: save.owned,
      solved: save.solved.map(Boolean),
      word: save.word,
      carved: !!save.carved,
      stoneRead: save.stoneRead,
      square: sealOpen ? null : save.square,
      open: !!save.doorWord,
      final: save.finalWord,
      denCoin: save.denCoin,
      chest: save.chestCoins,
    });
  }, [save, sealOpen]);

  // The photo is an image the canvas can draw.
  useEffect(() => {
    if (!save.photo) return;
    const image = new Image();
    image.onload = () => engineRef.current?.setFlags({ photo: image });
    image.src = save.photo;
  }, [save.photo]);

  // The stone can be carved once the family has both things it is carved from.
  const { carved: carvedStone, names: carveNames, word: carveWord } = save;
  useEffect(() => {
    if (!carveWord || !carveNames.length || carvedStone) return;
    let stale = false;
    let retry = 0;
    // A dropped connection here would leave the plate blank with nothing to say why: keep asking.
    const ask = () =>
      carveStone(family, carveWord, carveNames)
        .then((carved) => {
          if (!stale && carved) patch({ carved });
        })
        .catch(() => {
          if (!stale) retry = window.setTimeout(ask, RETRY_MS);
        });
    void ask();
    return () => {
      stale = true;
      window.clearTimeout(retry);
    };
  }, [carveNames, carveWord, carvedStone, family, patch]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as { __give: (n: number) => void }).__give = (n) =>
      patch((s) => ({ coins: s.coins + n }));
  }, [patch]);

  useEffect(() => {
    const id = window.setTimeout(() => setCoinSrc(coinPicture().toDataURL("image/png")), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    rootRef.current?.style.setProperty("--crawl-stone", `url(${stoneTexture()})`);
    rootRef.current?.style.setProperty("--crawl-bronze", `url(${bronzeTexture()})`);
    rootRef.current?.focus();
  }, []);

  // A line said by the room fades by itself, and so does a room's name.
  useEffect(() => {
    if (!bark) return;
    if (halted) return;
    const id = window.setTimeout(() => setBark(null), 3800);
    return () => window.clearTimeout(id);
  }, [bark, halted]);
  useEffect(() => {
    if (!title) return;
    if (halted) return;
    const id = window.setTimeout(() => setTitle(null), 2800);
    return () => window.clearTimeout(id);
  }, [halted, title]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code === "KeyM" && !trial && !halted) setMuted(!score.toggle());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [halted, score, trial]);

  const unhalt = useCallback(() => {
    engineRef.current?.thaw();
    score.hush(false);
    setHalted(false);
    rootRef.current?.focus();
  }, [score]);

  // Esc belongs to a close-up while one is open (it steps away), and to nothing during a moment.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code !== "Escape" || event.repeat) return;
      if (halted) return unhalt();
      const engine = engineRef.current;
      if (trial || closing.current || !engine?.canFreeze()) return;
      engine.freeze();
      score.hush(true);
      setHalted(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [halted, score, trial, unhalt]);

  // The hint beside the map says its piece for a few seconds, once each; a refresh does not repeat it.
  const [hint, setHint] = useState<{ kind: "rumble" } | { kind: "gears"; word: string } | null>(
    null,
  );
  useEffect(() => {
    if (!hint || halted) return;
    const id = window.setTimeout(() => setHint(null), HINT_MS);
    return () => window.clearTimeout(id);
  }, [halted, hint]);

  // The mask's word, as the mask's moment ends, with the sound of the gears it set going.
  const hintWord = save.word && !save.stoneRead ? save.word : null;
  const [hintArrived, setHintArrived] = useState(!!opening.word);
  if (hintWord && !hintArrived && !trial && !cine) {
    setHintArrived(true);
    setHint({ kind: "gears", word: hintWord });
  }
  useEffect(() => {
    if (hintArrived && !opening.word) {
      score.gears();
      engineRef.current?.shiver();
    }
  }, [hintArrived, opening.word, score]);

  // The fifth riddle answered: the mask has woken, and the tomb says so once the close-up has gone.
  const riddlesDone = save.solved.every(Boolean) && !save.word;
  const [rumbled, setRumbled] = useState(opening.solved.every(Boolean));
  if (riddlesDone && !rumbled && !trial && !cine) {
    setRumbled(true);
    setHint({ kind: "rumble" });
  }
  useEffect(() => {
    if (rumbled && !opening.solved.every(Boolean)) engineRef.current?.tremble();
  }, [opening.solved, rumbled]);

  const answers = save.solved.filter((a): a is string => !!a);
  const onClose = useCallback(() => closeTrial(), [closeTrial]);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-halted={halted ? "" : undefined}
      className="crawl fixed inset-0 overflow-clip bg-black outline-none"
      onPointerDown={() => score.arm()}
    >
      <p className="sr-only">
        A game seen from above. Arrow keys or W A S D move, E looks at what is nearby, M turns the
        sound off, Escape pauses.
      </p>
      <div ref={worldRef} className="crawl-world">
        <canvas ref={canvasRef} aria-hidden="true" className="crawl-canvas block" />
      </div>
      <div aria-hidden="true" className="crawl-vignette" />
      <div aria-hidden="true" data-on={cine ? "" : undefined} className="crawl-bars" />

      {/* There from the landing on: the map when it can be seen, under it the family's clock. */}
      <div
        data-trial={trial && !holding ? "" : undefined}
        className={falling || forging ? "crawl-corner crawl-hud-hidden" : "crawl-corner"}
      >
        <div className={trial || cine ? "crawl-corner-map crawl-hud-hidden" : "crawl-corner-map"}>
          <TombMap room={room} visited={save.visited} solved={save} dotRef={dotRef} />
        </div>
        <div
          aria-live="polite"
          className={trial || cine ? "crawl-hint-at crawl-hud-hidden" : "crawl-hint-at"}
        >
          {hint?.kind === "gears" ? (
            <p key="gears" className="crawl-hint font-oracle">
              Remember &ldquo;<b>{hint.word}</b>&rdquo;&hellip; you hear some gears shifting
            </p>
          ) : hint?.kind === "rumble" ? (
            <p key="rumble" className="crawl-hint font-oracle">
              Something rumbles&hellip;
            </p>
          ) : save.stoneRead && !save.seal && save.carved && save.word ? (
            // Where the family's letter is hidden, from the wheels until the seal is broken.
            <p key="letter" className="crawl-hint crawl-hint-stays font-oracle">
              {sentence(vigenere(save.carved, inscriptionKey(save.word, save.names, family), -1))}
            </p>
          ) : save.clue && !save.doorWord ? (
            // The door has no close-up any more, so the clue stays here until the fires are answered.
            <p key="clue" className="crawl-hint crawl-hint-stays font-oracle">
              {sentence(save.clue)}
            </p>
          ) : null}
        </div>
        {/* From the photo, when there are names to swap between, to the word, when there is no more to do. */}
        {save.names.length && !save.finalWord ? (
          <SwapTimer family={family} players={save.names} paused={cine || falling || halted} />
        ) : null}
      </div>

      {/* What stays on screen: whose tomb this is, the map, what the dinosaur can do right here. */}
      <div className={trial || cine || falling ? "crawl-hud crawl-hud-hidden" : "crawl-hud"}>
        <p aria-hidden="true" className="crawl-group font-olympus">
          <span>Group</span> {roman(family)}
        </p>
        <p
          aria-label={`${save.coins} ${save.coins === 1 ? "coin" : "coins"}`}
          className="crawl-purse font-olympus"
        >
          {coinSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- drawn in the browser, a data URL
            <img
              src={coinSrc}
              alt=""
              width={24}
              height={24}
              style={{ imageRendering: "pixelated" }}
            />
          ) : null}
          <span key={coinPop} className={coinPop ? "crawl-purse-pop" : undefined}>
            {save.coins}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setMuted(!score.toggle())}
          aria-label={muted ? "Turn the sound on" : "Turn the sound off"}
          aria-pressed={muted}
          className="crawl-sound"
        >
          {muted ? (
            <VolumeX className="size-4" aria-hidden="true" />
          ) : (
            <Volume2 className="size-4" aria-hidden="true" />
          )}
          <kbd className="crawl-key" aria-hidden="true">
            M
          </kbd>
        </button>

        {title ? (
          <p key={title.id} aria-hidden="true" className="crawl-title font-olympus">
            {title.text}
          </p>
        ) : null}
        {stamped && room === "hall" ? (
          <ol aria-label={`Pressed: ${stamped}`} className="crawl-stamps">
            {[...stamped].map((letter, i) => (
              <li key={i} className="font-olympus">
                {letter}
              </li>
            ))}
          </ol>
        ) : null}

        <div className="crawl-foot">
          <p key={bark?.id} role="status" className="crawl-bark font-oracle">
            {bark?.text}
          </p>
          <p aria-live="polite" className="crawl-prompt font-olympus">
            {prompt ? (
              <>
                <kbd className="crawl-key" aria-hidden="true">
                  E
                </kbd>{" "}
                {prompt}
              </>
            ) : null}
          </p>
        </div>
        <div
          aria-hidden="true"
          data-moved={moved ? "" : undefined}
          className="crawl-legend font-olympus"
        >
          <span>
            <kbd className="crawl-key">W</kbd>
            <kbd className="crawl-key">A</kbd>
            <kbd className="crawl-key">S</kbd>
            <kbd className="crawl-key">D</kbd>
            <i>or</i>
            <kbd className="crawl-key">←</kbd>
            <kbd className="crawl-key">↑</kbd>
            <kbd className="crawl-key">↓</kbd>
            <kbd className="crawl-key">→</kbd> Move
          </span>
          {stamped && room === "hall" ? (
            <span>
              <kbd className="crawl-key">⌫</kbd> Lift a letter
            </span>
          ) : null}
        </div>
      </div>

      {trial ? (
        <TrialShell
          label={LABELS[trial.kind]}
          leaving={leaving}
          onClose={onClose}
          wide={trial.kind === "stone"}
          bare={trial.kind === "mural" || holding}
          plain={
            trial.kind === "gate" ||
            trial.kind === "mirror" ||
            trial.kind === "arcade" ||
            trial.kind === "blackjack"
          }
          bronze={trial.kind === "stone"}
        >
          {trial.kind === "tablet" ? (
            <RiddleTablet
              family={family}
              index={trial.index}
              riddle={riddles[trial.index]!}
              answer={save.solved[trial.index] ?? null}
              onSolved={(answer) => {
                const index = trial.index;
                patch((s) => ({ solved: s.solved.map((a, i) => (i === index ? answer : a)) }));
                addCoins(1);
                // Stepped away while the server was answering: whatever is open now is not this.
                if (openTablet.current !== index) {
                  return engineRef.current?.play({ kind: "tablet", index });
                }
                pendingEvent.current = { kind: "tablet", index };
                settleTimer.current = window.setTimeout(() => closeTrial(), reduce ? 500 : 1500);
              }}
            />
          ) : trial.kind === "mural" ? (
            <MuralTrial
              photo={save.photo}
              faces={save.faces}
              names={save.names}
              onFrame={fitMural}
              onDone={(result) => {
                // The picture is on the wall before the frame over it fades, so nothing flickers.
                const settleIn = () => {
                  patch({ photo: result.photo, faces: result.faces, names: result.names });
                  addCoins(1);
                  closeTrial({ kind: "mural" });
                };
                if (!result.photo) return settleIn();
                const image = new Image();
                image.onload = () => {
                  engineRef.current?.setFlags({ photo: image });
                  settleIn();
                };
                image.onerror = settleIn;
                image.src = result.photo;
              }}
            />
          ) : trial.kind === "gate" ? (
            <WordGate
              family={family}
              answers={answers}
              guesses={save.guesses}
              quietUntil={save.quietUntil}
              onGuess={(g) => patch((s) => ({ guesses: [...s.guesses, g] }))}
              onSilence={(until) => patch({ guesses: [], quietUntil: until })}
              onSolved={(word) => {
                patch({ word });
                addCoins(1);
                settle("gate", { kind: "word" });
              }}
            />
          ) : trial.kind === "stone" ? (
            <StoneWheels
              family={family}
              word={save.word}
              names={save.names}
              carved={save.carved}
              read={save.stoneRead}
              onRead={() => {
                patch({ stoneRead: true });
                addCoins(1);
                settleAfter("stone", { kind: "stone" }, HOLD.stone);
              }}
            />
          ) : trial.kind === "door" ? (
            <SealDoor
              family={family}
              word={save.word}
              names={save.names}
              stoneRead={save.stoneRead}
              seal={save.seal}
              clue={save.clue}
              signal={signal}
              onBroken={({ seal, clue, square }) => {
                patch({ seal, clue, square });
                addCoins(1);
                // Stepped away while the server was answering: nothing to read, so straight on.
                if (openKind.current !== "door") return engineRef.current?.play({ kind: "square" });
                // The clue stays up until it is closed, and closing it raises the square.
                setSealOpen(true);
                pendingEvent.current = { kind: "square" };
              }}
            />
          ) : trial.kind === "mirror" ? (
            <Mirror
              look={save.look}
              owned={save.owned}
              onChange={(look: Look) => patch({ look })}
            />
          ) : trial.kind === "arcade" ? (
            <DinoRun
              look={save.look}
              coins={save.coins}
              best={save.best}
              onPay={() => addCoins(-1)}
              onCoin={() => addCoins(1)}
              onBest={(best) => patch({ best })}
              sound={score}
            />
          ) : trial.kind === "blackjack" ? (
            <Blackjack
              coins={save.coins}
              round={bjRound}
              onRound={setBjRound}
              onSpend={(n) => addCoins(-n)}
              onWin={(n) => patch((s) => ({ coins: s.coins + n }))}
              sound={score}
            />
          ) : holding && save.finalWord ? (
            <WordHeld word={save.finalWord} onDone={onClose} />
          ) : save.finalWord ? (
            <Finale word={save.finalWord} />
          ) : null}
        </TrialShell>
      ) : null}

      {halted ? <PauseMenu onResume={unhalt} /> : null}
    </div>
  );
}

/** Esc in the middle of play: everything has stopped, and this is the way back. Esc works too. */
function PauseMenu({ onResume }: { onResume: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Paused" className="crawl-pause">
      <h2 className="font-olympus text-h2 font-semibold tracking-[0.08em] uppercase">Paused</h2>
      <OlympusButton onClick={onResume}>Resume</OlympusButton>
    </div>
  );
}

/**
 * The word whole over the altar. The canvas has drawn it, so this says it for a screen reader and
 * says where to take it, in the lower bar. E or Enter steps away as well as Esc.
 */
function WordHeld({ word, onDone }: { word: string; onDone: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code === "KeyE" || event.code === "Enter") onDone();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);
  return (
    <p role="status" className="crawl-held font-olympus">
      <span className="sr-only">Your word: {word}. </span>
      Bring this word to the Oracle
    </p>
  );
}

/** A room's floor as a path, for the map: its true shape, a run of cells at a time. */
function shapePath(room: Room) {
  let d = "";
  for (let r = 0; r < room.rows; r += 1) {
    let run = -1;
    for (let c = 0; c <= room.cols; c += 1) {
      const on = c < room.cols && room.grid[c + r * room.cols];
      if (on && run < 0) run = c;
      if (!on && run >= 0) {
        d += `M${room.at[0] + run * CELL} ${room.at[1] + r * CELL}h${(c - run) * CELL}v${CELL}h${(run - c) * CELL}z`;
        run = -1;
      }
    }
  }
  return d;
}

const MAP_BOX = (() => {
  const x0 = Math.min(...ROOM_LIST.map((r) => r.at[0]));
  const y0 = Math.min(...ROOM_LIST.map((r) => r.at[1]));
  const x1 = Math.max(...ROOM_LIST.map((r) => r.at[0] + r.W));
  const y1 = Math.max(...ROOM_LIST.map((r) => r.at[1] + r.H));
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
})();
const MAP_PATHS = Object.fromEntries(ROOM_LIST.map((r) => [r.id, shapePath(r)])) as Record<
  RoomId,
  string
>;

/** The most the map closes in, with one room on it; the margin kept round what has been seen. */
const MAP_ZOOM = 2.6;
const MAP_MARGIN = 48;
const MAP_DOT = 24;

/** The whole map's scale and shift that fit these rooms: nothing at all once they are every room. */
function mapFit(rooms: readonly Room[]) {
  const x0 = Math.min(...rooms.map((r) => r.at[0])) - MAP_BOX.x0;
  const y0 = Math.min(...rooms.map((r) => r.at[1])) - MAP_BOX.y0;
  const x1 = Math.max(...rooms.map((r) => r.at[0] + r.W)) - MAP_BOX.x0;
  const y1 = Math.max(...rooms.map((r) => r.at[1] + r.H)) - MAP_BOX.y0;
  const k = Math.max(
    1,
    Math.min(
      MAP_ZOOM,
      MAP_BOX.w / (x1 - x0 + MAP_MARGIN * 2),
      MAP_BOX.h / (y1 - y0 + MAP_MARGIN * 2),
    ),
  );
  return { k, x: MAP_BOX.w / 2 - (k * (x0 + x1)) / 2, y: MAP_BOX.h / 2 - (k * (y0 + y1)) / 2 };
}

/**
 * The map in the corner: only the rooms that have been entered, each in its true shape. It starts
 * close in on the first and eases out as more are found, until with all nine it is the whole map.
 */
function TombMap({
  room,
  visited,
  solved,
  dotRef,
}: {
  room: RoomId;
  visited: RoomId[];
  solved: TombSave;
  dotRef: React.RefObject<SVGGElement | null>;
}) {
  const seen = ROOM_LIST.filter((r) => visited.includes(r.id));
  const fit = mapFit(seen.length ? seen : [ROOMS[room]]);
  const dot = MAP_DOT / fit.k;
  const done: Partial<Record<RoomId, boolean>> = {
    mural: !!solved.names.length,
    gate: !!solved.word,
    chasm: solved.stoneRead,
    hall: !!solved.square,
    sanctum: !!solved.finalWord,
  };
  return (
    <svg
      aria-hidden="true"
      className="crawl-map"
      viewBox={`0 0 ${MAP_BOX.w} ${MAP_BOX.h}`}
      shapeRendering="crispEdges"
    >
      <g
        className="crawl-map-zoom"
        style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.k})` }}
      >
        <g transform={`translate(${-MAP_BOX.x0} ${-MAP_BOX.y0})`}>
          {seen.map((r) => (
            <g key={r.id}>
              <path
                d={MAP_PATHS[r.id]}
                fill={r.id === room ? "var(--green-deep)" : "rgb(255 255 255 / 0.32)"}
              />
              {done[r.id] && r.id !== room ? (
                <rect
                  x={r.at[0] + r.W / 2 - 20}
                  y={r.at[1] + r.H / 2 - 20}
                  width={40}
                  height={40}
                  fill="var(--green)"
                />
              ) : null}
            </g>
          ))}
          {/* The same size on screen however far the map has closed in. */}
          <g ref={dotRef}>
            <rect
              className="crawl-map-dot"
              x={-dot / 2}
              y={-dot / 2}
              width={dot}
              height={dot}
              fill="var(--text)"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
