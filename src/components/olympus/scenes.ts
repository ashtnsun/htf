import type { SceneId } from "@/components/olympus/shared";

/**
 * The scenes the Oracle (/oracle) builds while REVEAL is held, one per god: the whole screen in
 * whole cells, in the colours of the god's own dinosaur (components/dino/reveal.ts). Each builder
 * paints cells with an `order` from 0 to 1, the moment in the charge each one is called in
 * (RevealGate flies them home in that order), so a scene builds the way it should: the sea rises,
 * wings unfurl from the middle, lightning strikes down. Nothing names a god here: the server picks
 * the scene once a family's word is right (consultOracle in app/olympus/actions.ts).
 */
export type SceneCell = { x: number; y: number; order: number; /** "r, g, b" */ ink: string };

type Painter = {
  cols: number;
  rows: number;
  cx: number;
  cy: number;
  /** Seeded, so a scene comes out the same after a resize. */
  rand: () => number;
  put: (x: number, y: number, hex: string, order: number) => void;
};

/** The light behind the REVEAL button takes each scene's colour. */
export const SCENE_GLOW: Record<SceneId, string> = {
  ocean: "#3388ff",
  caduceus: "#f2c94c",
  army: "#e5383b",
  olympus: "#f5c724",
  sun: "#ffb627",
  forest: "#d8dee6",
  temple: "#f2c94c",
  shell: "#ff6fae",
  underworld: "#3fcf6b",
};

/** mulberry32: a small seeded random. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "#3388ff" → "51, 136, 255", for rgba(). */
export function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** A colour faded toward the page background: k = 1 is the colour, 0 the background. */
function dim(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c * k + 11 * (1 - k));
  const out = (mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255);
  return `#${out.toString(16).padStart(6, "0")}`;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A small pixel map stamped at (x, y), `.` empty. */
function stamp(
  p: Painter,
  map: readonly string[],
  inks: Record<string, string>,
  x: number,
  y: number,
  order: (row: number) => number,
) {
  map.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch !== ".") p.put(x + c, y + r, inks[ch]!, order(r));
    });
  });
}

const SCENES: Record<SceneId, (p: Painter) => void> = {
  /**
   * Poseidon: a great wave after the old woodblock prints. A wall of water rises from the left,
   * climbs over the top and curls down on the right, so the word sits in its hollow: Prussian
   * blue in bands that follow the curl, white streaks running with it, foam claws at the crest.
   * A smaller wave breaks in front and a snowy peak stands on the far horizon.
   */
  ocean(p) {
    const { cols, rows, rand, put } = p;
    const seaY = rows * 0.72;
    const flow = (depth: number, s: number) => {
      if (depth < 1.3) return "#f2f6fa";
      if (depth < 2.5) return "#bcd6ee";
      if ((depth + Math.sin(s * 9) * 0.7) % 4.4 < 0.75) return "#7fb6e8";
      return depth < 6 ? "#2a5db8" : depth < 11 ? "#1b3f8f" : "#132d6b";
    };
    /** A curl around (cx, cy): `s` runs clockwise from due west, over the top, to the lip. */
    const curl = (
      cx: number,
      cy: number,
      R: number,
      smax: number,
      start: number,
      wall: boolean,
    ) => {
      const rOut = (s: number) => R * (1 - (0.42 * s) / smax);
      const thick = (s: number) => R * 0.6 * Math.max(0, 1 - s / smax) ** 1.15 + 1.4;
      for (let y = Math.max(0, Math.floor(cy - R - 8)); y < Math.min(rows, seaY + 3); y += 1) {
        for (
          let x = Math.max(0, Math.floor(cx - R * 2.5));
          x < Math.min(cols, cx + R * 1.6);
          x += 1
        ) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          const r = Math.hypot(dx, dy);
          const phi = Math.atan2(dy, dx);
          let s = (((phi - Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          if (s > Math.PI * 1.5) s -= Math.PI * 2;
          if (s <= smax && r <= rOut(s) && r >= rOut(s) - thick(s)) {
            put(x, y, flow(rOut(s) - r, s), start + (Math.max(0, s) / smax) * 0.5 + rand() * 0.04);
          } else if (wall && dx < -R * 0.6) {
            // The wall slopes down from the curl to the left edge.
            const surface = cy - R * 0.55 + (-dx - R * 0.6) * 0.5;
            if (y >= surface)
              put(
                x,
                y,
                flow(y - surface + 0.2, x * 0.05),
                start - 0.08 + ((rows - y) / rows) * 0.2,
              );
          }
        }
      }
      // Foam claws along the crest, reaching forward, and spray thrown off them.
      for (let k = 0; k < 11; k += 1) {
        const sk = smax * (0.5 + (0.46 * k) / 10);
        for (let j = 0; j < 6; j += 1) {
          for (const w of [0, -0.7]) {
            const s = sk + j * 0.045;
            const r = rOut(sk) + j * 0.75 + w;
            put(
              cx + Math.cos(Math.PI + s) * r,
              cy + Math.sin(Math.PI + s) * r,
              "#f2f6fa",
              start + 0.5 + rand() * 0.05,
            );
          }
        }
      }
      for (let k = 0; k < R * 2; k += 1) {
        const s = smax * (0.35 + rand() * 0.65);
        const r = rOut(s) + 1.5 + rand() * 5;
        put(
          cx + Math.cos(Math.PI + s) * r,
          cy + Math.sin(Math.PI + s) * r,
          rand() < 0.6 ? "#f2f6fa" : "#bcd6ee",
          start + 0.55 + rand() * 0.1,
        );
      }
    };
    // The open sea, from the bottom up, and the far peak.
    for (let y = rows - 1; y >= 0; y -= 1) {
      for (let x = 0; x < cols; x += 1) {
        const surface = seaY + 1.2 * Math.sin(x * 0.27) + 0.8 * Math.sin(x * 0.11 + 2);
        if (y < surface) continue;
        const d = y - surface;
        const crest = (d + 1.5 * Math.sin(x * 0.4 + y)) % 5 < 0.8;
        put(
          x,
          y,
          d < 1 ? "#bcd6ee" : crest ? "#7fb6e8" : d < 6 ? "#1b3f8f" : "#132d6b",
          ((rows - y) / rows) * 0.25 + rand() * 0.04,
        );
      }
    }
    const fx = cols * 0.6;
    for (let y = Math.floor(seaY - 8); y < seaY; y += 1) {
      const half = (y - (seaY - 8)) * 1.7;
      for (let x = Math.round(fx - half); x <= fx + half; x += 1) {
        put(x, y, y < seaY - 5.5 ? "#f2f6fa" : "#3a4a6a", 0.3 + rand() * 0.05);
      }
    }
    curl(cols * 0.47, rows * 0.45, rows * 0.43, Math.PI * 1.32, 0.3, true);
    curl(cols * 0.86, seaY - rows * 0.02, rows * 0.13, Math.PI * 1.2, 0.2, false);
  },

  /**
   * Hermes: the caduceus, as an emblem. A glowing orb crowns a thick banded gold staff that runs
   * the height of the screen inside a great double ring, rays of light falling from the orb. Under
   * it spread two raised wings: a shoulder rising from the staff to the wrist, shorter feathers
   * hanging from the arm, long flight feathers fanning out from the wrist with the longest
   * pointing up and out, gold at the tips. Two serpents coil up the staff in a double helix
   * (crossing in front of it and behind it) and rear up on either side of the word, their viper
   * heads facing each other across it.
   */
  caduceus(p) {
    const { cols, rows, cx, cy, rand, put } = p;
    const orbY = 4;
    const y0 = rows * 0.42;
    const y1 = rows * 0.97;
    const far = Math.hypot(cols, rows);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - orbY;
        const d = Math.hypot(dx, dy);
        if (d < 7) continue;
        const step = (Math.PI * 2) / 18;
        const theta = Math.atan2(dy, dx);
        const off = Math.abs(theta - Math.round(theta / step) * step) * d;
        if (off < 0.8 + d * 0.02) put(x, y, dim("#f2c94c", 0.32), 0.88 + (d / far) * 0.1);
      }
    }
    const R = rows * 0.46;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const turn = (Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + Math.PI) / (Math.PI * 2);
        const order = 0.02 + turn * 0.2;
        if (Math.abs(d - R) < 0.6 || Math.abs(d - (R + 3)) < 0.6) put(x, y, "#c9962a", order);
        else if (d > R + 0.6 && d < R + 2.4 && Math.floor(turn * 72) % 2 === 0) {
          put(x, y, dim("#f2c94c", 0.55), order);
        }
      }
    }
    const staffTop = orbY + 3;
    const shades = ["#8a6a1c", "#fbe7a1", "#f2c94c", "#c9962a", "#8a6a1c"];
    for (let y = Math.floor(staffTop); y < rows; y += 1) {
      const band = (y - Math.floor(staffTop)) % 8 < 1;
      for (let i = 0; i < 5; i += 1) {
        put(
          Math.floor(cx) - 2 + i,
          y,
          band ? "#8a6a1c" : shades[i]!,
          0.1 + ((rows - y) / rows) * 0.25,
        );
      }
    }
    const isStaff = (x: number, y: number) =>
      y >= staffTop && Math.abs(x + 0.5 - (Math.floor(cx) + 0.5)) < 2.6;
    // The serpents.
    const A = Math.min(cols * 0.12, rows * 0.2);
    const omega = (Math.PI * 2 * 1.5) / (y1 - y0);
    const inks = [
      { body: "#14c4b0", light: "#7ff0de", line: "#0a4f47", scale: "#0f9e8f" },
      { body: "#3ddc84", light: "#a3f5c4", line: "#11502b", scale: "#27b468" },
    ];
    type Disc = {
      x: number;
      y: number;
      nx: number;
      ny: number;
      r: number;
      z: number;
      s: number;
      snake: number;
    };
    const coil = (snake: number, s: number) => {
      const sign = snake ? -1 : 1;
      const y = y0 + (y1 - y0) * s;
      const amp = A * (1 - 0.55 * s ** 2);
      const theta = omega * (y - y0) + Math.PI / 2;
      return { x: cx + sign * amp * Math.sin(theta), y, z: sign * Math.cos(theta) };
    };
    const disc = (d: Disc, order: number) => {
      const ink = inks[d.snake]!;
      for (let y = Math.floor(d.y - d.r); y <= d.y + d.r; y += 1) {
        for (let x = Math.floor(d.x - d.r); x <= d.x + d.r; x += 1) {
          const ox = x + 0.5 - d.x;
          const oy = y + 0.5 - d.y;
          if (Math.hypot(ox, oy) > d.r) continue;
          if (d.z < 0 && isStaff(x, y)) continue;
          const o = (ox * d.nx + oy * d.ny) / d.r;
          const scale = Math.floor(d.s * 160) % 3 === 0 && Math.abs(o) < 0.45;
          put(
            x,
            y,
            Math.abs(o) > 0.7 ? ink.line : o < -0.25 ? ink.light : scale ? ink.scale : ink.body,
            order,
          );
        }
      }
    };
    const discs: Disc[] = [];
    for (const snake of [0, 1]) {
      for (let s = 0; s <= 1; s += 0.002) {
        const a = coil(snake, s);
        const b = coil(snake, Math.min(1, s + 0.002));
        const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        discs.push({
          x: a.x,
          y: a.y,
          nx: -(b.y - a.y) / tl,
          ny: (b.x - a.x) / tl,
          r: 2.4 * (1 - 0.55 * s ** 2),
          z: a.z,
          s,
          snake,
        });
      }
    }
    discs.sort((a, b) => a.z - b.z);
    for (const d of discs) disc(d, 0.32 + (1 - d.s) * 0.38 + rand() * 0.02);
    // The wings.
    const feather = (
      bx: number,
      by: number,
      a: number,
      dir: number,
      L: number,
      w: number,
      gilt: boolean,
      order: number,
    ) => {
      const ux = dir * Math.cos(a);
      const uy = Math.sin(a);
      const nx = uy * dir;
      const ny = -ux * dir;
      const half = (u: number) =>
        u < 0 || u > L
          ? -1
          : u > L - w
            ? w * Math.sqrt(Math.max(0, 1 - ((u - (L - w)) / w) ** 2))
            : w;
      for (let y = Math.floor(by - L - 2); y <= by + L + 2; y += 1) {
        for (let x = Math.floor(bx - L - 2); x <= bx + L + 2; x += 1) {
          const rx = x + 0.5 - bx;
          const ry = y + 0.5 - by;
          const u = rx * ux + ry * uy;
          const v = rx * nx + ry * ny;
          const h = half(u);
          if (Math.abs(v) > h) continue;
          const edge = Math.abs(v - 1) > half(u) || Math.abs(v) > half(u + 1);
          // Light grey lines between the feathers; gold only on the flight feathers' tips.
          const tip = gilt && u > L * 0.8;
          const ink = edge
            ? tip
              ? "#c9962a"
              : "#a9a7bc"
            : tip
              ? "#f2c94c"
              : v > h * 0.3
                ? "#e1e0ea"
                : "#fafafc";
          put(x, y, ink, order + (u / rows) * 0.06);
        }
      }
    };
    const rootY = rows * 0.25;
    const wristX = cols * 0.15;
    const wristY = rows * 0.15;
    for (const dir of [-1, 1]) {
      // The arm: up from the staff, curving out to the wrist.
      const arm = (t: number) => {
        const sx = cx + dir * 2.5;
        const kx = cx + dir * 4;
        const ex = cx + dir * wristX;
        const ky = wristY - 1;
        return {
          x: (1 - t) ** 2 * sx + 2 * (1 - t) * t * kx + t * t * ex,
          y: (1 - t) ** 2 * rootY + 2 * (1 - t) * t * ky + t * t * wristY,
        };
      };
      // Shorter feathers hanging from the arm, inner first.
      for (let k = 0; k < 6; k += 1) {
        const f = k / 5;
        const base = arm(0.15 + 0.75 * f);
        feather(
          base.x,
          base.y,
          1.45 - 0.55 * f,
          dir,
          rows * (0.1 + 0.03 * f),
          1.8,
          false,
          0.78 + f * 0.03,
        );
      }
      // Flight feathers fanning from the wrist, lowest first, the longest pointing up and out.
      for (let k = 0; k < 6; k += 1) {
        const f = k / 5;
        const base = arm(0.9 + 0.1 * f);
        feather(
          base.x,
          base.y,
          0.55 - 0.93 * f,
          dir,
          rows * (0.16 + 0.11 * f),
          2,
          true,
          0.82 + f * 0.04,
        );
      }
      // The leading edge: a band of small scalloped feathers along the arm, gold along its top.
      for (let t = 0; t <= 1.02; t += 0.01) {
        const pt = arm(Math.min(1, t));
        const thick = 3 * (1 - 0.4 * t);
        for (let oy = 0; oy <= thick + 1; oy += 1) {
          const scallop = (Math.floor(t * 30) + oy) % 3 === 0;
          const ink =
            oy === 0 ? "#f2c94c" : oy > thick ? "#c9962a" : scallop ? "#dcdbe6" : "#fafafc";
          put(pt.x, pt.y + oy, ink, 0.86 + t * 0.03);
        }
      }
    }
    // The serpents rear up on either side of the word, heads facing each other across it: a neck
    // from the top of each coil, a viper head, a white eye with a dark pupil, a forked tongue.
    for (const snake of [0, 1]) {
      const sign = snake ? -1 : 1;
      const ink = inks[snake]!;
      const top = coil(snake, 0);
      const hx = cx + sign * Math.min(cols * 0.25, 26);
      const hy = rows * 0.33;
      const kx = cx + sign * (A + 8);
      const ky = top.y + 1;
      for (let t = 0; t <= 1; t += 0.01) {
        const x = (1 - t) ** 2 * top.x + 2 * (1 - t) * t * kx + t * t * (hx + sign * 2);
        const y = (1 - t) ** 2 * top.y + 2 * (1 - t) * t * ky + t * t * hy;
        disc({ x, y, nx: 1, ny: 0, r: 2.3, z: 1, s: 0, snake }, 0.7 + t * 0.03);
      }
      for (let y = Math.floor(hy - 4); y <= hy + 4; y += 1) {
        for (let x = Math.floor(hx - 7); x <= hx + 7; x += 1) {
          // A broad back narrowing to the snout, which points at the staff.
          const fx = (x + 0.5 - hx) * -sign;
          const ex = fx / (fx > 0 ? 5.5 : 3.6);
          const ey = (y + 0.5 - hy) / (3.2 - Math.max(0, fx) * 0.25);
          const e = ex * ex + ey * ey;
          if (e > 1) continue;
          put(x, y, e > 0.6 ? ink.line : ey < -0.1 ? ink.light : ink.body, 0.74);
        }
      }
      put(hx + sign * 0.5, hy - 1.5, "#ffffff", 0.76);
      put(hx - sign * 0.5, hy - 1.5, "#0b0b0b", 0.76);
      const snout = hx - sign * 5.5;
      for (let t = 0; t < 3; t += 1) put(snout - sign * t, hy + 0.5, "#ec1809", 0.76);
      put(snout - sign * 3, hy - 0.5, "#ec1809", 0.76);
      put(snout - sign * 3, hy + 1.5, "#ec1809", 0.76);
    }
    for (let y = Math.floor(orbY - 4); y <= orbY + 4; y += 1) {
      for (let x = Math.floor(cx - 4); x <= cx + 4; x += 1) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - orbY);
        if (d > 3.6) continue;
        put(x, y, d > 2.8 ? "#8a6a1c" : d > 1.6 ? "#f2c94c" : "#fffbe6", 0.95);
      }
    }
  },

  /**
   * Ares: a giant bronze war helmet looms behind the word: a domed crown, two eye holes over a
   * nose guard, long cheek guards, a tall red horsehair plume fanning up from it. Under it a wall
   * of shields bristles with spears, war banners at both sides. The army forms up first, then
   * the helmet rises, then the plume.
   */
  army(p) {
    const { cols, rows, cx, cy, rand, put } = p;
    // Spears held upright behind the shields, steel points catching the light.
    for (let x = 1; x < cols; x += 4) {
      const tipY = Math.round(rows * (0.4 + rand() * 0.1));
      for (let y = tipY; y < rows - 8; y += 1) {
        const o = ((rows - y) / rows) * 0.32 + rand() * 0.03;
        if (y < tipY + 3) {
          put(x, y, "#d8dee6", o);
          if (y === tipY + 1) {
            put(x - 1, y, "#9aa4b0", o);
            put(x + 1, y, "#9aa4b0", o);
          }
        } else put(x, y, "#6d4e31", o);
      }
    }
    for (let i = 0, sx = -2; sx < cols + 6; sx += 8, i += 1) {
      for (let y = rows - 12; y < rows; y += 1) {
        for (let x = sx - 6; x <= sx + 6; x += 1) {
          const d = Math.hypot(x - sx, y - (rows - 5.5));
          if (d > 6) continue;
          const ink =
            d > 5
              ? "#b07a45"
              : d < 1.5
                ? "#f2c94c"
                : Math.abs(x - sx) < 1 && y > rows - 5.5
                  ? "#f2c94c"
                  : i % 2
                    ? "#e5383b"
                    : "#a8242a";
          put(x, y, ink, 0.05 + rand() * 0.1);
        }
      }
    }
    for (const fx of [0.07, 0.93]) {
      const x = Math.round(cols * fx);
      const ptop = Math.round(rows * 0.1);
      for (let y = ptop; y < rows - 6; y += 1)
        put(x, y, "#6d4e31", 0.3 + ((rows - y) / rows) * 0.15);
      put(x, ptop - 1, "#d8dee6", 0.5);
      put(x, ptop - 2, "#d8dee6", 0.5);
      const fw = 13;
      const fh = 20;
      const left = x - Math.floor(fw / 2);
      for (let by = 0; by < fh; by += 1) {
        for (let bx = 0; bx < fw; bx += 1) {
          if (by > fh - 5 && Math.abs(bx - (fw - 1) / 2) < by - (fh - 5) + 0.5) continue;
          const border = bx === 0 || bx === fw - 1 || by === 0;
          const emblem = by >= 5 && by <= 12 && Math.abs(bx - 6) + Math.abs(by - 8.5) < 3.6;
          put(
            left + bx,
            ptop + 1 + by,
            border || emblem ? "#f2c94c" : "#e5383b",
            0.4 + (by / fh) * 0.12,
          );
        }
      }
    }
    // The helmet.
    const Hw = Math.min(rows * 0.3, cols * 0.25);
    const yTop = cy - rows * 0.3;
    const yc = cy - rows * 0.02;
    const ry = yc - yTop;
    const yBot = cy + rows * 0.38;
    const eyeY = cy - rows * 0.05;
    const noseBottom = cy + rows * 0.1;
    const half = (y: number) =>
      y < yc
        ? Hw * Math.sqrt(Math.max(0, 1 - ((y - yc) / ry) ** 2))
        : Hw * (1 - 0.12 * ((y - yc) / (yBot - yc)) ** 1.4);
    const open = (x: number, y: number) => {
      const px = x + 0.5 - cx;
      const ax = Math.abs(px);
      const py = y + 0.5;
      // Two almond eye holes, their inner corners dipping toward the nose.
      const ex = (ax - Hw * 0.42) / (Hw * 0.34);
      const eh = rows * 0.06 * (1 - ex * ex);
      const dip = Math.max(0, -ex) * rows * 0.03;
      if (Math.abs(ex) < 1 && Math.abs(py - eyeY - dip) < eh) return true;
      // Channels beside the nose guard, and the mouth gap widening to the chin.
      if (py >= eyeY && py < noseBottom) return ax > 1.6 && ax < Hw * 0.16;
      if (py >= noseBottom && py < yBot) return ax < Hw * 0.12 + (py - noseBottom) * 0.32;
      return false;
    };
    for (let y = Math.floor(yTop); y < yBot; y += 1) {
      const w = half(y);
      for (let x = Math.floor(cx - w); x <= cx + w; x += 1) {
        if (open(x, y)) continue;
        const ax = x + 0.5 - cx;
        const edge =
          w - Math.abs(ax) < 1.2 ||
          y >= yBot - 1 ||
          open(x - 1, y) ||
          open(x + 1, y) ||
          open(x, y - 1) ||
          open(x, y + 1);
        const lit = (-ax / Hw) * 0.55 + ((yc - y) / ry) * 0.6;
        const brow = Math.abs(y + 0.5 - (eyeY - rows * 0.075)) < 0.8 && Math.abs(ax) < Hw * 0.8;
        const ink = edge
          ? "#3a2a1a"
          : brow
            ? "#f2c94c"
            : lit > 0.5
              ? "#f0c48a"
              : lit > 0.15
                ? "#d9a066"
                : lit > -0.25
                  ? "#b07a45"
                  : "#7d5530";
        put(x, y, ink, 0.4 + ((yBot - y) / (yBot - yTop)) * 0.38 + rand() * 0.03);
      }
    }
    // The plume: horsehair fanning up from a gold holder on the crown, strand by strand.
    for (let y = 0; y < yTop + 2; y += 1) {
      const rise = yTop + 2 - y;
      const w = Math.min(Hw * 0.75, 2 + rise * 0.85);
      for (let x = Math.floor(cx - w); x <= cx + w; x += 1) {
        const px = x + 0.5 - cx;
        const crown = 1 + 1.6 * Math.abs(Math.sin(px * 0.8));
        if (y < crown) continue;
        const holder = rise < 3;
        const strand = Math.floor(px / 1.5 + 100) % 3;
        const ink = holder
          ? "#f2c94c"
          : Math.abs(px) > w - 1 || y < crown + 1
            ? "#7a1414"
            : strand === 0
              ? "#ff3b3b"
              : strand === 1
                ? "#e5383b"
                : "#b3262a";
        put(x, y, ink, 0.8 + (rise / (yTop + 2)) * 0.18);
      }
    }
  },

  /**
   * Zeus: Mount Olympus, the throne of the gods. Two ranges of far ridges, then the mountain
   * itself climbing behind the word: a main peak and a shoulder to either side, jagged at every
   * scale, each slope lit or in shadow by which way it faces, the high ridges frosted and the
   * summit capped in snow. A sea of cumulus rolls across its foot, lit gold along the top. The
   * golden palace of the gods stands on the summit, light fanning up behind it, and Zeus's eagles
   * circle. Built from the clouds up to the palace, then the light.
   */
  olympus(p) {
    const { cols, rows, cx, rand, put } = p;
    const summitY = rows * 0.15;
    const far = Math.hypot(cols, rows);
    // Light fanning up from behind the summit, under everything.
    for (let y = 0; y < rows * 0.6; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - summitY;
        const d = Math.hypot(dx, dy);
        const order = 0.8 + (d / far) * 0.16;
        if (d < 9) {
          put(x, y, dim("#fff3b0", 0.5 - d * 0.04), order);
          continue;
        }
        const theta = Math.atan2(dy, dx);
        if (Math.sin(theta) > -0.3) continue;
        const step = Math.PI / 9;
        const k = Math.round(theta / step);
        if (Math.abs(theta - k * step) * d < 0.6 + d * 0.022) {
          put(x, y, k % 2 ? dim("#ffaa00", 0.3) : dim("#f5c724", 0.4), order);
        }
      }
    }
    // A roughened profile: the midpoints of a line pushed up and down, finer and finer.
    const rough = (n: number, amp: number) => {
      const out = new Array<number>(n + 1).fill(0);
      const split = (a: number, b: number, s: number) => {
        if (b - a < 2) return;
        const m = Math.floor((a + b) / 2);
        out[m] = (out[a]! + out[b]!) / 2 + (rand() - 0.5) * s;
        split(a, m, s * 0.55);
        split(m, b, s * 0.55);
      };
      split(0, n, amp);
      return out;
    };
    const noise = rough(cols + 1, 5);
    const ridge = (
      base: number,
      a: number,
      b: number,
      lit: string,
      shade: string,
      start: number,
    ) => {
      const h = (x: number) =>
        base + a * Math.sin(x * 0.09 + b) + a * 0.6 * Math.sin(x * 0.23 + b * 2) + noise[x]! * 0.5;
      for (let x = 0; x < cols; x += 1) {
        const top = h(x);
        const facing = h(x + 1) - h(x - 1);
        for (let y = Math.floor(top); y < rows; y += 1)
          put(x, y, facing > 0 ? shade : lit, start + ((rows - y) / rows) * 0.2);
      }
    };
    ridge(rows * 0.42, 6, 1, "#33395f", "#24284a", 0.18);
    ridge(rows * 0.52, 5, 2.4, "#3f4f80", "#2b365f", 0.24);
    // The mountain: the lowest of three peaks' slopes at each column, roughened.
    const peaks = [
      // A flat summit as wide as the palace and a cell to spare either side.
      { at: 0, y: summitY, slope: 1.05, flat: 5.5 },
      { at: -22, y: summitY + 12, slope: 1 },
      { at: 24, y: summitY + 10, slope: 1 },
    ];
    const top = (x: number) => {
      const dx = x + 0.5 - cx;
      const base = Math.min(
        ...peaks.map((pk) => pk.y + Math.max(0, Math.abs(dx - pk.at) - (pk.flat ?? 0)) * pk.slope),
      );
      // The rock grows rougher further from the summit.
      return (
        base +
        noise[Math.max(0, Math.min(cols, x))]! * Math.min(1, Math.max(0, Math.abs(dx) - 5.5) / 8)
      );
    };
    for (let x = 0; x < cols; x += 1) {
      const t = top(x);
      const facing = top(x + 1) - top(x - 1);
      const lit = facing < 0;
      for (let y = Math.floor(t); y < rows; y += 1) {
        const depth = y - t;
        // Snow on the summit and on each shoulder, its lower edge ragged.
        const ragged = 2.5 * Math.sin(x * 1.3) + 1.5 * Math.sin(x * 0.7);
        const cap =
          y < summitY + 10 + ragged ||
          peaks.some(
            (pk) =>
              pk.at !== 0 && Math.abs(x + 0.5 - cx - pk.at) < 7 && y < pk.y + 4 + ragged * 0.6,
          );
        // Contour lines following the slope.
        const contour = Math.floor(depth) % 6 === 3;
        const frost = depth < 1.6 && y < summitY + 19;
        const ink =
          cap || frost
            ? lit
              ? "#f5f8ff"
              : "#b5c3e2"
            : lit
              ? depth < 1.2
                ? "#c4d3f0"
                : contour
                  ? "#5c71a0"
                  : depth < 7
                    ? "#8aa0c8"
                    : "#7f96c2"
              : depth < 1.2
                ? "#4a5c93"
                : contour
                  ? "#1f2a4d"
                  : "#2f3d63";
        put(x, y, ink, 0.32 + ((rows - y) / (rows - summitY)) * 0.42 + rand() * 0.03);
      }
    }
    // The sea of cloud: puffs in two bands, each puff lit from the top, shadowed underneath.
    const band = (
      base: number,
      r: number,
      inks: [string, string, string, string],
      start: number,
    ) => {
      const puffs: { x: number; y: number; r: number }[] = [];
      for (let px = -r + rand() * r; px < cols + r; px += r * (1.1 + rand() * 0.5)) {
        puffs.push({ x: px, y: base + (rand() - 0.5) * r * 0.8, r: r * (0.75 + rand() * 0.5) });
      }
      // The lower puffs are nearer: drawn last, their lit tops over the shadowed undersides behind.
      puffs.sort((a, b) => a.y - b.y);
      for (const pf of puffs) {
        for (let y = Math.floor(pf.y - pf.r); y < rows; y += 1) {
          for (let x = Math.floor(pf.x - pf.r); x <= pf.x + pf.r; x += 1) {
            const dx = x + 0.5 - pf.x;
            const dy = y + 0.5 - pf.y;
            if (dy < 0 ? dx * dx + dy * dy > pf.r * pf.r : Math.abs(dx) > pf.r) continue;
            // Lit from the upper left.
            const rel = (dy * 0.85 + dx * 0.35) / pf.r;
            const ink =
              rel < -0.6 ? inks[0] : rel < -0.1 ? inks[1] : rel < 0.45 ? inks[2] : inks[3];
            put(x, y, ink, start + ((rows - y) / rows) * 0.15 + rand() * 0.03);
          }
        }
      }
    };
    band(rows * 0.8, 7, ["#cfd5e6", "#aab2cc", "#8790b0", "#646d90"], 0.08);
    band(rows * 0.92, 8.5, ["#fff6dc", "#e9edf6", "#c3cadf", "#8f98b8"], 0);
    // The palace of the gods on the summit, in gold.
    const palace = [
      "....g....",
      "..ggggg..",
      ".ggwwwgg.",
      "ggggggggg",
      ".w.w.w.w.",
      ".w.w.w.w.",
      ".w.w.w.w.",
      "ooooooooo",
    ];
    const px0 = Math.round(cx - 4.5);
    // Its base row stands on the summit's top row.
    const py0 = Math.floor(summitY) - palace.length;
    palace.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === ".") return;
        const ink = ch === "g" ? "#f5c724" : ch === "w" ? "#fff3b0" : "#ffaa00";
        put(px0 + c, py0 + r, ink, 0.76 + ((palace.length - r) / palace.length) * 0.06);
      });
    });
    // Zeus's eagles, soaring round the summit.
    const eagle = ["##.....##", "..##.##..", "....#...."];
    for (const [ex, ey] of [
      [-26, 4],
      [17, 1],
      [30, 11],
      [-38, 14],
    ] as const) {
      eagle.forEach((row, r) => {
        [...row].forEach((ch, c) => {
          if (ch === "#")
            put(
              Math.round(cx + ex) + c,
              Math.round(summitY + ey - 8) + r,
              "#f5c724",
              0.9 + rand() * 0.05,
            );
        });
      });
    }
  },

  /** Apollo: a great sun rises behind the word, its rays reaching out to every edge. */
  sun(p) {
    const { cols, rows, cx, cy, rand, put } = p;
    const R = rows * 0.38;
    const far = Math.hypot(cols, rows) / 2;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= R) {
          const ink = d > R - 1.5 ? "#ff8c1a" : Math.floor(d / 2.5) % 2 ? "#ffd23f" : "#ffb627";
          put(x, y, ink, (d / R) * 0.35 + rand() * 0.04);
          continue;
        }
        if (d < R + 1.5) continue;
        if (d < R + 3) {
          put(x, y, dim("#ffd23f", 0.7), 0.36 + rand() * 0.04);
          continue;
        }
        const theta = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
        const step = (Math.PI * 2) / 20;
        const k = Math.round(theta / step);
        const off = Math.abs(theta - k * step) * d;
        const long = k % 2 === 0;
        if (!long && d > R * 1.9) continue;
        if (off < 1.1 + d * 0.035) {
          put(x, y, long ? "#ffd23f" : "#ff8c1a", 0.4 + ((d - R) / far) * 0.55 + rand() * 0.04);
        }
      }
    }
  },

  /** Artemis: a pine forest grows up from the ground, then the moon, the stars and the arrows. */
  forest(p) {
    const { cols, rows, cx, rand, put } = p;
    const pine = (bx: number, by: number, h: number, inks: [string, string], start: number) => {
      const maxW = h * 0.3;
      for (let r = 0; r < h; r += 1) {
        const y = by - h + r;
        const half = (r / h) * maxW * (0.6 + 0.4 * ((r % 4) / 3));
        for (let x = Math.round(bx - half); x <= bx + half; x += 1) {
          put(x, y, x < bx ? inks[0] : inks[1], start + ((rows - y) / rows) * 0.8 + rand() * 0.05);
        }
      }
      put(bx, by, "#85552b", start);
      put(bx, by + 1, "#85552b", start);
    };
    const layers: { base: number; h: [number, number]; inks: [string, string]; step: number }[] = [
      { base: rows - 6, h: [16, 24], inks: ["#0f4d26", "#145c2e"], step: 5 },
      { base: rows - 3, h: [12, 18], inks: ["#007a31", "#009e3f"], step: 6 },
      { base: rows - 1, h: [8, 13], inks: ["#3f8f2a", "#5cb33c"], step: 7 },
    ];
    for (const layer of layers) {
      for (let x = rand() * layer.step; x < cols; x += layer.step + rand() * 2) {
        const edge = 1 + 0.7 * ((x - cx) / cx) ** 2;
        const h = (layer.h[0] + rand() * (layer.h[1] - layer.h[0])) * edge;
        pine(Math.round(x), layer.base, Math.round(h), layer.inks, 0);
      }
    }
    for (let k = 0; k < 80; k += 1) {
      put(
        rand() * cols,
        rand() * rows * 0.5,
        rand() < 0.7 ? "#f5f5f5" : "#9be564",
        0.82 + rand() * 0.16,
      );
    }
    // A crescent moon over the middle.
    const mx = cx;
    const my = rows * 0.17;
    const R = Math.max(6, rows * 0.13);
    for (let y = Math.floor(my - R); y <= my + R; y += 1) {
      for (let x = Math.floor(mx - R); x <= mx + R; x += 1) {
        const d = Math.hypot(x - mx, y - my);
        const cut = Math.hypot(x - (mx + R * 0.45), y - (my - R * 0.25));
        if (d <= R && cut > R * 0.85) {
          put(x, y, cut < R * 1.05 ? "#bfc8d4" : "#e8eef5", 0.74 + rand() * 0.1);
        }
      }
    }
    // Arrows loosed across the sky, on both sides of the moon.
    for (const [fx, fy] of [
      [0.08, 0.42],
      [0.2, 0.3],
      [0.66, 0.36],
      [0.78, 0.22],
    ] as const) {
      const x0 = cols * fx;
      const y0 = rows * fy;
      for (let i = 0; i < 14; i += 1) {
        const x = x0 + i;
        const y = y0 - i * 0.4;
        const ink = i < 3 ? "#9be564" : i > 11 ? "#d8dee6" : "#b07a45";
        put(x, y, ink, 0.86 + (i / 14) * 0.1);
        if (i < 3) put(x, y + 1, "#9be564", 0.86);
      }
      put(x0 + 12, y0 - 13 * 0.4 - 1, "#d8dee6", 0.96);
      put(x0 + 12, y0 - 13 * 0.4 + 1, "#d8dee6", 0.96);
    }
  },

  /** Athena: the Parthenon builds itself around the word, from the steps to the pediment. */
  temple(p) {
    const { cols, rows, cx, rand, put } = p;
    const W = cols * 0.88;
    const left = cx - W / 2;
    const right = cx + W / 2;
    const top = rows * 0.05;
    const pedBase = rows * 0.24;
    const entBottom = rows * 0.31;
    const colBottom = rows * 0.85;
    const floor = rows * 0.98;
    const stepH = (floor - colBottom) / 3;
    for (let y = Math.floor(colBottom); y < floor; y += 1) {
      const tier = Math.floor((y - colBottom) / stepH);
      const edgeRow = (y - colBottom) % stepH < 1;
      for (let x = Math.floor(left - 2 - tier * 2); x <= right + 2 + tier * 2; x += 1) {
        put(
          x,
          y,
          edgeRow ? "#e3e8ee" : tier % 2 ? "#a9b2bd" : "#c6ced7",
          ((floor - y) / rows) * 0.6 + rand() * 0.04,
        );
      }
    }
    const n = 10;
    const spacing = W / n;
    const flutes = ["#e3e8ee", "#c6ced7", "#a9b2bd", "#c6ced7"];
    for (let i = 0; i < n; i += 1) {
      const x0 = Math.round(left + spacing * (i + 0.5) - 2);
      for (let y = Math.floor(entBottom); y < colBottom; y += 1) {
        const order = 0.18 + ((colBottom - y) / (colBottom - entBottom)) * 0.4 + rand() * 0.04;
        const capital = y < entBottom + 2;
        const base = y > colBottom - 2;
        if (capital || base) {
          for (let x = x0 - 1; x <= x0 + 4; x += 1)
            put(x, y, capital ? "#f2c94c" : "#e3e8ee", order);
        } else {
          for (let c = 0; c < 4; c += 1) put(x0 + c, y, flutes[c]!, order);
        }
      }
    }
    for (let y = Math.floor(pedBase); y < entBottom; y += 1) {
      const band = y - Math.floor(pedBase);
      for (let x = Math.floor(left - 2); x <= right + 2; x += 1) {
        const ink =
          band === 0 ? "#e3e8ee" : band === 2 ? (x % 4 < 2 ? "#f2c94c" : "#c9962a") : "#c6ced7";
        put(x, y, ink, 0.62 + ((entBottom - y) / rows) * 0.4 + rand() * 0.03);
      }
    }
    for (let y = Math.floor(top); y < pedBase; y += 1) {
      const half = ((y - top) / (pedBase - top)) * (W / 2 + 2);
      for (let x = Math.round(cx - half); x <= cx + half; x += 1) {
        const outline = Math.abs(x - cx) > half - 1.5 || y >= pedBase - 1;
        put(
          x,
          y,
          outline ? "#e3e8ee" : "#7f8794",
          0.74 + ((pedBase - y) / (pedBase - top)) * 0.22 + rand() * 0.03,
        );
      }
    }
    for (const [x, y] of [
      [cx, top - 1],
      [left - 2, pedBase - 1],
      [right + 2, pedBase - 1],
    ] as const) {
      put(x, y, "#f2c94c", 0.98);
      put(x, y - 1, "#f2c94c", 0.98);
    }
  },

  /** Aphrodite: a giant scallop shell fans open out of the foam, hearts drifting up around it. */
  shell(p) {
    const { cols, rows, cx, rand, put } = p;
    const hy = rows * 0.97;
    const R = Math.min(rows * 0.9, cols * 0.5);
    const RIBS = 15;
    for (let y = 0; y < hy; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const d = Math.hypot(x + 0.5 - cx, hy - y);
        const theta = Math.atan2(hy - y, x + 0.5 - cx);
        const frac = ((theta / Math.PI) * RIBS) % 1;
        const edge = R * (0.95 + 0.05 * Math.sin(frac * Math.PI));
        if (d > edge || d < 2.5) continue;
        const ink =
          d > edge - 1.2
            ? "#ffe3ef"
            : frac < 0.12 || frac > 0.88
              ? "#c94f8a"
              : Math.floor(d) % 6 === 0
                ? "#f08cbc"
                : frac < 0.5
                  ? "#ffc2dc"
                  : "#ff6fae";
        put(x, y, ink, 0.1 + (d / R) * 0.75 + rand() * 0.04);
      }
    }
    for (let y = rows - 3; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        put(x, y, Math.sin(x * 0.5 + y * 2) > 0.3 ? "#e8f6ff" : "#4cc9ff", rand() * 0.08);
      }
    }
    const heart = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
    for (let k = 0; k < 10; k += 1) {
      const side = k % 2 ? 1 : -1;
      const x = cx + side * (cols * 0.3 + rand() * cols * 0.17) - 3;
      const y = rows * (0.08 + rand() * 0.5);
      const o = 0.86 + rand() * 0.12;
      stamp(
        p,
        heart,
        { "#": rand() < 0.5 ? "#ff6fae" : "#c40303" },
        Math.round(x),
        Math.round(y),
        () => o,
      );
    }
  },

  /** Hades: green hellfire climbs from behind a row of skulls, souls drifting up out of it. */
  underworld(p) {
    const { cols, rows, cx, rand, put } = p;
    const ground = rows - 3;
    for (let y = ground; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1)
        put(x, y, (x + y) % 3 ? "#2a2a2c" : "#3a3a3d", rand() * 0.06);
    }
    const maxH = rows * 0.62;
    for (let x = 0; x < cols; x += 1) {
      const edge = 1 + 0.55 * ((x - cx) / cx) ** 2;
      const h =
        rows *
        (0.3 +
          0.1 * Math.sin(x * 0.17) +
          0.07 * Math.sin(x * 0.41 + 2) +
          0.05 * Math.sin(x * 0.9)) *
        edge;
      // Down to the ground: the skulls are stamped over it, so it shows between them and in their
      // eyes. The base is a deeper green, licking up raggedly into the white heart, or the bone
      // would vanish against the white.
      const base = ground - 8 - 1.5 * Math.sin(x * 0.53) - Math.sin(x * 1.3 + 1);
      for (let y = Math.floor(ground - 6 - h); y < ground; y += 1) {
        const f = (ground - 6 - y) / h;
        if (f > 0.7 && rand() < (f - 0.7) * 1.8) continue;
        const ink =
          y > base
            ? "#3fcf6b"
            : y > base - 2
              ? "#7cfc9a"
              : f < 0.22
                ? "#d9ffe3"
                : f < 0.5
                  ? "#7cfc9a"
                  : f < 0.8
                    ? "#3fcf6b"
                    : "#1f8a45";
        put(x, y, ink, 0.1 + ((ground - y) / maxH) * 0.7 + rand() * 0.05);
      }
    }
    const skull = [".###.", "#####", "#.#.#", "#####", ".#.#."];
    for (let x = 2; x < cols - 4; x += 9) {
      stamp(p, skull, { "#": "#ede6d6" }, x, ground - 5, () => 0.04 + rand() * 0.06);
    }
    const soul = [".o.", "oao", "oao", ".a.", ".a."];
    for (let k = 0; k < 14; k += 1) {
      // One to a slice of the screen, so no two land on each other.
      const x = ((k + rand()) / 14) * (cols - 3);
      const y = rows * (0.04 + rand() * 0.3);
      const o = 0.84 + rand() * 0.14;
      stamp(p, soul, { o: "#d9ffe3", a: "#7cfc9a" }, Math.round(x), Math.round(y), () => o);
    }
  },
};

/** One scene in cells, for a screen `cols` × `rows` cells. */
export function buildScene(id: SceneId, cols: number, rows: number): SceneCell[] {
  const cells = new Map<number, SceneCell>();
  SCENES[id]({
    cols,
    rows,
    cx: cols / 2,
    cy: rows / 2,
    rand: seeded(7),
    put(x, y, hex, order) {
      const gx = Math.round(x);
      const gy = Math.round(y);
      if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return;
      cells.set(gy * cols + gx, { x: gx, y: gy, order: clamp01(order), ink: rgb(hex) });
    },
  });
  return [...cells.values()];
}
