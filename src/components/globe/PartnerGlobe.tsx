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
import { LabelAnchor } from "./LabelAnchor";
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
  /** The soft green glow behind the sphere (off when a parent frame draws its own). */
  glow?: boolean;
  className?: string;
};

/** The label under the pointer: the pin, and whether it is still hovered (false: fading out). */
type Hover = { pin: GlobePin; on: boolean };

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
 * demand once the globe scrolls near the viewport and fades in over it. Dragging turns the
 * globe in any direction (sideways spins it, up and down tips it, within limits); vertical
 * touch drags still scroll the page, so on a phone the tilt comes from diagonal drags.
 * Pins with a `label` show it in a hairline rectangle while hovered, and the globe holds
 * still until the pointer leaves. Decoration: whatever stands next to the globe (the location
 * list on /nonprofits, the Get involved copy) is the accessible content.
 */
export function PartnerGlobe({ pins, activeId, glow = true, className }: PartnerGlobeProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const webgl = useSyncExternalStore(noSubscribe, getWebglSupport, () => false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [controller] = useState(() => new SpinController(INITIAL_SPIN * DEG));
  const [label] = useState(() => new LabelAnchor());
  const [hover, setHover] = useState<Hover | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

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
    dragStart.current = { x: event.clientX, y: event.clientY };
    controller.startDrag();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    controller.drag(
      (event.clientX - dragStart.current.x) * DRAG_RADIANS_PER_PIXEL,
      (event.clientY - dragStart.current.y) * DRAG_RADIANS_PER_PIXEL,
    );
  }
  function onPointerUp() {
    dragStart.current = null;
    controller.endDrag();
    setDragging(false);
  }

  const hasLabels = pins.some((pin) => pin.label);
  function onHover(pin: GlobePin | null) {
    setHover((prev) => (pin ? { pin, on: true } : prev ? { ...prev, on: false } : null));
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
      {glow ? (
        <div className="pointer-events-none absolute inset-[-10%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.22),transparent)]" />
      ) : null}
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
            label={hasLabels ? label : undefined}
            onHover={hasLabels ? onHover : undefined}
            onReady={() => setReady(true)}
          />
        </div>
      ) : null}
      {hasLabels ? (
        // The hover label: a hairline rectangle with a leader line down to the pin. The scene
        // positions it through the LabelAnchor; only its text and fade go through React.
        <div
          ref={(el) => label.attach(el)}
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-10 border border-line-strong bg-bg px-2.5 py-1.5 text-[13px] leading-none font-medium whitespace-nowrap text-text transition-opacity duration-200",
            "after:absolute after:top-full after:left-1/2 after:h-2.5 after:w-px after:bg-green",
            hover?.on ? "opacity-100" : "opacity-0",
          )}
        >
          {hover?.pin.label}
        </div>
      ) : null}
    </div>
  );
}
