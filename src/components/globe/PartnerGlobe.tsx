"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Globe, type GlobePin } from "@/components/home/Globe";
import { DEG } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { SpinController } from "./SpinController";

const PartnerGlobeScene = dynamic(
  () => import("./PartnerGlobeScene").then((m) => m.PartnerGlobeScene),
  { ssr: false },
);

/** Degrees: longitude −45° (the Atlantic, between the U.S. and Europe/Africa) starts in front. */
const INITIAL_SPIN = 45;
const DRAG_RADIANS_PER_PIXEL = 0.006;

type PartnerGlobeProps = {
  pins: GlobePin[];
  activeId: string | null;
  className?: string;
};

let webglSupport: boolean | null = null;

/** Once per page: WebGL available, and the visitor has not asked to save data. */
function getWebglSupport(): boolean {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData) webglSupport = false;
  }
  return webglSupport;
}

const noSubscribe = () => () => {};

/**
 * Globe with partner pins. The SVG wireframe renders first (and is all that renders without
 * WebGL, on data-saver connections, or before JavaScript); the three.js scene loads on
 * demand once the globe scrolls near the viewport and fades in over it. Dragging spins the
 * globe; vertical touch drags still scroll the page. Decoration: the location list next to
 * it is the accessible content.
 */
export function PartnerGlobe({ pins, activeId, className }: PartnerGlobeProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const webgl = useSyncExternalStore(noSubscribe, getWebglSupport, () => false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [controller] = useState(() => new SpinController(INITIAL_SPIN * DEG));
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "240px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart.current = event.clientX;
    controller.startDrag();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    controller.drag((event.clientX - dragStart.current) * DRAG_RADIANS_PER_PIXEL);
  }
  function onPointerUp() {
    dragStart.current = null;
    controller.endDrag();
    setDragging(false);
  }

  const showScene = webgl && inView;
  // Under reduced motion the scene renders on demand only, except while a drag needs frames.
  const running = inView && pageVisible && (!reduceMotion || dragging);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      onPointerDown={showScene ? onPointerDown : undefined}
      onPointerMove={showScene ? onPointerMove : undefined}
      onPointerUp={showScene ? onPointerUp : undefined}
      onPointerCancel={showScene ? onPointerUp : undefined}
      style={{ touchAction: "pan-y" } as CSSProperties}
      className={cn(
        "relative aspect-square w-full select-none",
        showScene && (dragging ? "cursor-grabbing" : "cursor-grab"),
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-[-10%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.22),transparent)]" />
      <Globe
        pins={pins}
        activePinId={activeId}
        spin={INITIAL_SPIN}
        animate={false}
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-out-quart",
          ready && "opacity-0",
        )}
      />
      {showScene ? (
        <div className="absolute inset-0">
          <PartnerGlobeScene
            pins={pins}
            activeId={activeId}
            controller={controller}
            reduceMotion={reduceMotion}
            running={running}
            onReady={() => setReady(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
