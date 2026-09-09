"use client";

import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { GlobePin } from "@/components/home/Globe";
import { DEG, GLOBE_TILT, sphericalToVector } from "@/lib/geo";
import type { LabelAnchor } from "./LabelAnchor";
import { loadLandDots } from "./landDots";
import type { SpinController } from "./SpinController";

/**
 * The three.js partner globe: an occluding sphere in the page background colour so only the
 * front hemisphere shows, the wireframe (parallels every 15°, meridians every 12°, like the
 * SVG globe), the land dots of the dotted world map, and one square pin per partner
 * location. The rotation (spin about the polar axis, plus the drag tilt on top of the
 * resting GLOBE_TILT) lives in a SpinController owned by the wrapper (PartnerGlobe), which
 * also handles dragging; this file advances it each frame. Pins with a `label` are hoverable:
 * the pointer over one freezes the globe, lights the pin and reports it to the wrapper, which
 * shows the label at the position this scene writes through the LabelAnchor. Loaded on
 * demand with next/dynamic.
 */

const GREEN = "#03c652";
const MINT = "#00eb88";
const BG = "#0b0b0b";
const AUTO_SPIN = 3 * DEG; // radians per second, matches the SVG globe
const CAMERA_Z = 3.8;
const PIN_RADIUS = 1.012;
/** Radius of the invisible disc that catches the pointer around a labelled pin (world units). */
const HIT_RADIUS = 0.075;
/**
 * A point on the unit sphere faces the camera when its z (toward the viewer) exceeds 1 / the
 * camera distance; a little more keeps pins on the very limb from taking the hover.
 */
const FRONT_Z = 1 / CAMERA_Z + 0.04;
/** Pixels between the pin's centre and the label's leader line. */
const LABEL_GAP = 12;

type SceneProps = {
  pins: GlobePin[];
  activeId: string | null;
  controller: SpinController;
  reduceMotion: boolean;
  /** Continuous rendering while in view; on demand otherwise. */
  running: boolean;
  /** Where the hover label goes; the wrapper attaches its element. */
  label?: LabelAnchor;
  /** A labelled pin came under the pointer (or left it: null). */
  onHover?: (pin: GlobePin | null) => void;
  onReady?: () => void;
};

function wireframeGeometry(): THREE.BufferGeometry {
  const SEGMENTS = 96;
  const points: number[] = [];
  const push = (a: [number, number, number], b: [number, number, number]) =>
    points.push(...a, ...b);
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let i = 0; i < SEGMENTS; i++) {
      const a = (i / SEGMENTS) * 360;
      const b = ((i + 1) / SEGMENTS) * 360;
      push(sphericalToVector(lat, a), sphericalToVector(lat, b));
    }
  }
  for (let lng = 0; lng < 180; lng += 12) {
    for (let i = 0; i < SEGMENTS; i++) {
      // A full circle through both poles: latitude sweeps −90 → 90 on one side, back on the other.
      const t0 = (i / SEGMENTS) * 360;
      const t1 = ((i + 1) / SEGMENTS) * 360;
      const at = (t: number): [number, number, number] =>
        t <= 180 ? sphericalToVector(t - 90, lng) : sphericalToVector(270 - t, lng + 180);
      push(at(t0), at(t1));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

const RING = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.1, 0.1));
const OUT = new THREE.Vector3(0, 0, 1);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const scratch = new THREE.Vector3();

/**
 * A pin's place on the canvas, in pixels from the top left, and how much it faces the viewer
 * (`facing` is its world z: positive toward the camera). Applies the scene's rotations in
 * order (spin about the pole, then the tilt) and the camera's projection.
 */
function projectPin(
  pin: GlobePin,
  controller: SpinController,
  camera: THREE.Camera,
  size: { width: number; height: number },
) {
  scratch.set(...sphericalToVector(pin.lat, pin.lng, PIN_RADIUS));
  scratch.applyAxisAngle(Y_AXIS, controller.spin);
  scratch.applyAxisAngle(X_AXIS, GLOBE_TILT * DEG + controller.tilt);
  const facing = scratch.z;
  scratch.project(camera);
  return {
    x: ((scratch.x + 1) / 2) * size.width,
    y: ((1 - scratch.y) / 2) * size.height,
    facing,
  };
}

function Pin({
  pin,
  active,
  reduceMotion,
  onOver,
  onOut,
}: {
  pin: GlobePin;
  active: boolean;
  reduceMotion: boolean;
  onOver?: (pin: GlobePin) => void;
  onOut?: (pin: GlobePin) => void;
}) {
  const ringRef = useRef<THREE.LineSegments>(null);
  const { position, quaternion } = useMemo(() => {
    const dir = new THREE.Vector3(...sphericalToVector(pin.lat, pin.lng));
    return {
      position: dir.clone().multiplyScalar(PIN_RADIUS),
      quaternion: new THREE.Quaternion().setFromUnitVectors(OUT, dir),
    };
  }, [pin.lat, pin.lng]);

  useFrame(({ clock }) => {
    const ring = ringRef.current;
    if (!ring) return;
    if (reduceMotion) {
      ring.scale.setScalar(1.2);
      return;
    }
    const t = (clock.elapsedTime % 1.8) / 1.8;
    ring.scale.setScalar(1 + t * 1.4);
    (ring.material as THREE.LineBasicMaterial).opacity = 1 - t;
  });

  const hoverable = Boolean(pin.label && onOver && onOut);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh scale={active ? 1.5 : 1}>
        <planeGeometry args={[0.036, 0.036]} />
        <meshBasicMaterial color={active ? MINT : GREEN} toneMapped={false} />
      </mesh>
      {hoverable ? (
        // An invisible disc, far larger than the pin, so the pointer finds it. Raycasting
        // ignores material visibility; rendering honours it.
        <mesh onPointerOver={() => onOver?.(pin)} onPointerOut={() => onOut?.(pin)}>
          <circleGeometry args={[HIT_RADIUS, 20]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      ) : null}
      {active ? (
        <lineSegments ref={ringRef} geometry={RING}>
          <lineBasicMaterial color={MINT} transparent toneMapped={false} />
        </lineSegments>
      ) : null}
    </group>
  );
}

function Scene({
  pins,
  activeId,
  controller,
  reduceMotion,
  label,
  onHover,
}: Omit<SceneProps, "running" | "onReady">) {
  const tiltRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const get = useThree((state) => state.get);
  const wire = useMemo(() => wireframeGeometry(), []);
  const [dots, setDots] = useState<THREE.BufferGeometry | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => () => wire.dispose(), [wire]);

  useEffect(() => {
    let alive = true;
    loadLandDots()
      .then((positions) => {
        if (!alive) return;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        setDots(geometry);
        invalidate();
      })
      .catch(() => {
        /* the wireframe alone is fine */
      });
    return () => {
      alive = false;
    };
  }, [invalidate]);

  useEffect(() => () => dots?.dispose(), [dots]);

  // Bring the chosen pin to the front (a pin at longitude L faces the camera at spin −L).
  useEffect(() => {
    const pin = pins.find((p) => p.id === activeId);
    if (!pin) return;
    controller.aim(-pin.lng * DEG);
    invalidate();
  }, [activeId, pins, controller, invalidate]);

  // Let go of the hold if the scene unmounts (or the pins change) mid-hover.
  useEffect(() => () => controller.hover(false), [controller, pins]);

  function onOver(pin: GlobePin) {
    const { camera, size } = get();
    const place = projectPin(pin, controller, camera, size);
    // The raycaster sees through the occluding sphere: pins on the back are not hoverable.
    if (place.facing < FRONT_Z) return;
    label?.place(place.x, place.y - LABEL_GAP);
    controller.hover(true);
    setHoveredId(pin.id);
    onHover?.(pin);
    invalidate();
  }

  function onOut(pin: GlobePin) {
    if (hoveredId !== pin.id) return;
    controller.hover(false);
    setHoveredId(null);
    onHover?.(null);
    invalidate();
  }

  useFrame(({ clock, camera, size }, delta) => {
    const easing = controller.step(
      Math.min(delta, 0.1),
      clock.elapsedTime,
      reduceMotion ? 0 : AUTO_SPIN,
      reduceMotion,
    );
    if (easing) invalidate();
    if (groupRef.current) groupRef.current.rotation.y = controller.spin;
    if (tiltRef.current) tiltRef.current.rotation.x = GLOBE_TILT * DEG + controller.tilt;
    // The label follows its pin (a drag can move it while the pointer is captured).
    const hovered = hoveredId === null ? undefined : pins.find((p) => p.id === hoveredId);
    if (hovered && label) {
      const place = projectPin(hovered, controller, camera, size);
      label.place(place.x, place.y - LABEL_GAP, place.facing >= FRONT_Z);
    }
  });

  return (
    <group ref={tiltRef} rotation={[GLOBE_TILT * DEG, 0, 0]}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.985, 48, 48]} />
          <meshBasicMaterial color={BG} toneMapped={false} />
        </mesh>
        <lineSegments geometry={wire}>
          <lineBasicMaterial color={GREEN} transparent opacity={0.45} toneMapped={false} />
        </lineSegments>
        {dots ? (
          <points geometry={dots}>
            <pointsMaterial
              color={GREEN}
              size={0.014}
              sizeAttenuation
              transparent
              opacity={0.9}
              depthWrite={false}
              toneMapped={false}
            />
          </points>
        ) : null}
        {pins.map((pin) => (
          <Pin
            key={pin.id}
            pin={pin}
            active={pin.id === activeId || pin.id === hoveredId}
            reduceMotion={reduceMotion}
            onOver={onHover ? onOver : undefined}
            onOut={onHover ? onOut : undefined}
          />
        ))}
      </group>
    </group>
  );
}

export function PartnerGlobeScene({ running, onReady, ...scene }: SceneProps) {
  const handleCreated = (state: RootState) => {
    // Vertical swipes over the globe keep scrolling the page; the wrapper handles drags.
    state.gl.domElement.style.touchAction = "pan-y";
    onReady?.();
  };
  return (
    <Canvas
      frameloop={running ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, CAMERA_Z], fov: 32, near: 0.1, far: 10 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={handleCreated}
    >
      <Scene {...scene} />
    </Canvas>
  );
}
