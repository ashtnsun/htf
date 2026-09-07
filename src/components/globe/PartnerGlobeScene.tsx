"use client";

import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { GlobePin } from "@/components/home/Globe";
import { DEG, GLOBE_TILT, sphericalToVector } from "@/lib/geo";
import { loadLandDots } from "./landDots";
import type { SpinController } from "./SpinController";

/**
 * The three.js partner globe: an occluding sphere in the page background colour so only the
 * front hemisphere shows, the wireframe (parallels every 15°, meridians every 12°, like the
 * SVG globe), the land dots of the dotted world map, and one square pin per partner
 * location. The rotation lives in a SpinController owned by the wrapper (PartnerGlobe),
 * which also handles dragging; this file advances it each frame. Loaded on demand with
 * next/dynamic.
 */

const GREEN = "#03c652";
const MINT = "#00eb88";
const BG = "#0b0b0b";
const AUTO_SPIN = 3 * DEG; // radians per second, matches the SVG globe
const CAMERA_Z = 3.8;

type SceneProps = {
  pins: GlobePin[];
  activeId: string | null;
  controller: SpinController;
  reduceMotion: boolean;
  /** Continuous rendering while in view; on demand otherwise. */
  running: boolean;
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

function Pin({
  pin,
  active,
  reduceMotion,
}: {
  pin: GlobePin;
  active: boolean;
  reduceMotion: boolean;
}) {
  const ringRef = useRef<THREE.LineSegments>(null);
  const { position, quaternion } = useMemo(() => {
    const dir = new THREE.Vector3(...sphericalToVector(pin.lat, pin.lng));
    return {
      position: dir.clone().multiplyScalar(1.012),
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

  return (
    <group position={position} quaternion={quaternion}>
      <mesh scale={active ? 1.5 : 1}>
        <planeGeometry args={[0.036, 0.036]} />
        <meshBasicMaterial color={active ? MINT : GREEN} toneMapped={false} />
      </mesh>
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
}: Omit<SceneProps, "running" | "onReady">) {
  const groupRef = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const wire = useMemo(() => wireframeGeometry(), []);
  const [dots, setDots] = useState<THREE.BufferGeometry | null>(null);

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

  useFrame(({ clock }, delta) => {
    const easing = controller.step(
      Math.min(delta, 0.1),
      clock.elapsedTime,
      reduceMotion ? 0 : AUTO_SPIN,
      reduceMotion,
    );
    if (easing) invalidate();
    if (groupRef.current) groupRef.current.rotation.y = controller.spin;
  });

  return (
    <group rotation={[GLOBE_TILT * DEG, 0, 0]}>
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
          <Pin key={pin.id} pin={pin} active={pin.id === activeId} reduceMotion={reduceMotion} />
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
