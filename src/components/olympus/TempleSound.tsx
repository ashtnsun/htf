"use client";

import "@/components/olympus/crawl/crawl.css";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { tombSound } from "@/components/olympus/crawl/sound";

const BUILD_SECONDS = 2;
const BUTTON = "data-temple-sound";

function act() {
  if (tombSound.state() === "blocked") tombSound.arm();
  else tombSound.toggle();
}

/**
 * The sound of /olympus: a lyre far off. A
 * browser plays nothing on a fresh page until a key or a click, so the button says so rather than
 * showing a speaker that is not working; any key or click wakes it, and the one on a column carries
 * on into the game (`tombSound`). M mutes, as it does in the game.
 */
export function TempleSound() {
  const state = useSyncExternalStore(tombSound.subscribe, tombSound.state, () => "blocked");

  useEffect(() => {
    tombSound.enter("temple");
    if (tombSound.armIfAllowed() && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tombSound.templeRise(BUILD_SECONDS);
    }
    const onButton = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest(`[${BUTTON}]`);
    const onPointer = (event: PointerEvent) => {
      if (!onButton(event.target)) tombSound.arm();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === "KeyM") act();
      // Enter or Space on the button is the button's own click.
      else if (!onButton(event.target)) tombSound.arm();
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      tombSound.leaveTemple();
    };
  }, []);

  const on = state === "on";
  return (
    <button
      type="button"
      {...{ [BUTTON]: "" }}
      onClick={act}
      aria-pressed={state === "off"}
      aria-label={on ? "Turn the sound off" : "Turn the sound on"}
      className="temple-after fixed right-5 bottom-4 z-10 flex min-h-11 items-center gap-2 px-2 font-olympus text-xs font-semibold tracking-[0.16em] text-muted uppercase transition-colors hover:text-green"
    >
      {state === "blocked" ? <span>Sound</span> : null}
      {on ? (
        <Volume2 className="size-4" aria-hidden="true" />
      ) : (
        <VolumeX className="size-4" aria-hidden="true" />
      )}
      <kbd className="crawl-key" aria-hidden="true">
        M
      </kbd>
    </button>
  );
}
