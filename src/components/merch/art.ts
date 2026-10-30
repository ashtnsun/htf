import { INKS, SLEEVE_SPANS, type Design } from "./design";
import { BACK_ART, CENTRE_X, SLEEVE_FRAME } from "./garment";
import type { MockupArt } from "./HoodieMockup";
import { backPiece, sleevePiece, type ArtPiece, type SigilOptions } from "./sigil";

/**
 * The art behind the mockup: the generated sigil, or artwork uploaded for a slot (the club's
 * own drawings, or art it has commissioned or licensed), turned into the same white mask the
 * generator draws, so both print through the same inks and finishes.
 */

/** An uploaded piece: a white-on-transparent mask and its size in pixels. */
export type Upload = { url: string; w: number; h: number };
export type Uploads = { sleeve: Upload | null; back: Upload | null };

/** Only the choices that change the drawing, so the inks and garment never redraw it. */
export function drawingKey(d: Design) {
  return JSON.stringify([
    d.seed,
    d.density,
    d.thorns,
    d.weight,
    d.ribs,
    d.lattice,
    d.beads,
    d.needles,
    d.mirror,
    d.line,
    d.back,
    d.span,
    d.marks.pendant,
  ]);
}

/** The generated pieces; `ppu` scales the resolution (the artwork export draws finer). */
export function generate(d: Design, ppu = 1): MockupArt {
  const o: SigilOptions = {
    seed: d.seed,
    density: d.density,
    thorns: d.thorns,
    weight: d.weight,
    ribs: d.ribs,
    lattice: d.lattice,
    beads: d.beads,
    needles: d.needles,
  };
  const span = SLEEVE_SPANS[d.span];
  const sleeve = (seed: number) =>
    sleevePiece(
      { ...o, seed },
      d.line,
      SLEEVE_FRAME.length,
      SLEEVE_FRAME.width,
      span.from,
      span.to,
      ppu,
    );
  const left = sleeve(d.seed);
  return {
    left,
    right: d.mirror ? left : sleeve(d.seed + 1),
    back:
      d.back === "none"
        ? null
        : backPiece(
            o,
            d.line,
            d.back,
            BACK_ART.anchor,
            CENTRE_X,
            BACK_ART.top,
            BACK_ART.bottom,
            d.marks.pendant,
            ppu,
          ),
  };
}

let cache: { key: string; art: MockupArt } | null = null;

/** `generate` at the mockup's resolution, remembering the last drawing so a change of ink,
 * finish or garment does not draw it again. */
export function generateCached(d: Design): MockupArt {
  const key = drawingKey(d);
  if (cache?.key !== key) cache = { key, art: generate(d) };
  return cache.art;
}

/** Places uploads over the generated art: a sleeve upload fills the sleeve's width from the
 * seam down; a back upload sits centred under the hood at the chosen size and height. */
export function withUploads(art: MockupArt, uploads: Uploads, d: Design): MockupArt {
  const out = { ...art };
  if (uploads.sleeve) {
    const u = uploads.sleeve;
    let w = SLEEVE_FRAME.width * 0.92;
    let h = (w * u.h) / u.w;
    const max = SLEEVE_FRAME.length * 0.95;
    if (h > max) {
      w *= max / h;
      h = max;
    }
    const piece: ArtPiece = { box: { x: -w / 2, y: 8, w, h }, fill: u.url, inline: null };
    out.left = piece;
    out.right = piece;
  }
  if (uploads.back) {
    // Fitted inside the back panel below the hood: `uploadScale` caps the width,
    // `uploadY` moves the top down, and the height never runs past the hem.
    const u = uploads.back;
    const top = 450 + d.uploadY * 260;
    let w = 560 * d.uploadScale;
    let h = (w * u.h) / u.w;
    const maxH = 985 - top;
    if (h > maxH) {
      w *= maxH / h;
      h = maxH;
    }
    out.back = { box: { x: CENTRE_X - w / 2, y: top, w, h }, fill: u.url, inline: null };
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

/**
 * Turns a drawing into a mask: a transparent PNG keeps its own alpha; anything else is read
 * as ink on paper, the background taken from the border, so dark lines on light and light
 * lines on dark both work. Cropped to the ink and capped at 2000 px on the long side.
 */
export async function processUpload(file: File): Promise<Upload> {
  const src = URL.createObjectURL(file);
  try {
    const img = await loadImage(src);
    const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No canvas here.");
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h);
    const d = px.data;
    const n = w * h;
    let clear = 0;
    for (let i = 0; i < n; i++) if (d[i * 4 + 3]! < 200) clear++;
    const alpha = new Float32Array(n);
    const lum = (i: number) => 0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!;
    if (clear / n > 0.02) {
      for (let i = 0; i < n; i++) alpha[i] = d[i * 4 + 3]! / 255;
    } else {
      const border: number[] = [];
      for (let x = 0; x < w; x++) border.push(lum(x), lum((h - 1) * w + x));
      for (let y = 0; y < h; y++) border.push(lum(y * w), lum(y * w + w - 1));
      border.sort((a, b) => a - b);
      const bg = border[Math.floor(border.length / 2)]!;
      const all = Array.from({ length: n }, (_, i) => lum(i)).sort((a, b) => a - b);
      const ink = bg > 127 ? all[Math.floor(n * 0.01)]! : all[Math.floor(n * 0.99)]!;
      const range = Math.abs(bg - ink) || 1;
      for (let i = 0; i < n; i++) {
        const v = Math.abs(bg - lum(i)) / range;
        alpha[i] = Math.min(1, Math.max(0, (v - 0.3) / 0.4));
      }
    }
    // Crop to the ink.
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (alpha[y * w + x]! > 0.05) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
      }
    }
    if (x1 < 0) throw new Error("No artwork found in that image.");
    const cw = x1 - x0 + 1;
    const ch = y1 - y0 + 1;
    const out = new ImageData(cw, ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const o = (y * cw + x) * 4;
        out.data[o] = 255;
        out.data[o + 1] = 255;
        out.data[o + 2] = 255;
        out.data[o + 3] = Math.round(alpha[(y + y0) * w + x + x0]! * 255);
      }
    }
    canvas.width = cw;
    canvas.height = ch;
    ctx.putImageData(out, 0, 0);
    return { url: canvas.toDataURL("image/png"), w: cw, h: ch };
  } finally {
    URL.revokeObjectURL(src);
  }
}

/**
 * The flat artwork as one transparent PNG in the chosen inks: the left sleeve, the back and
 * the right sleeve side by side at one scale (6 px a garment unit, so a 60 cm back piece is
 * about 300 dpi), the generated pieces drawn at three times the mockup's resolution.
 */
export async function artworkPng(d: Design, uploads: Uploads): Promise<Blob | null> {
  const art = withUploads(generate(d, 3), uploads, d);
  const k = 6; // pixels per garment unit
  const slots = [
    { p: art.left, flip: false },
    { p: art.back, flip: false },
    { p: art.right, flip: true },
  ].filter((s): s is { p: ArtPiece; flip: boolean } => !!s.p);
  const images = await Promise.all(
    slots.map(async ({ p, flip }) => ({
      flip,
      w: Math.round(p.box.w * k),
      h: Math.round(p.box.h * k),
      fill: await loadImage(p.fill),
      inline: p.inline ? await loadImage(p.inline) : null,
    })),
  );
  const gap = 80;
  const height = Math.max(...images.map((i) => i.h));
  const width = images.reduce((s, i) => s + i.w, 0) + gap * (images.length - 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const tinted = (img: HTMLImageElement, hex: string, flip: boolean, w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d")!;
    if (flip) {
      cx.translate(c.width, 0);
      cx.scale(-1, 1);
    }
    cx.drawImage(img, 0, 0, w, h);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.globalCompositeOperation = "source-in";
    cx.fillStyle = hex;
    cx.fillRect(0, 0, c.width, c.height);
    return c;
  };
  let x = 0;
  images.forEach(({ flip, fill, inline, w, h }) => {
    ctx.drawImage(tinted(fill, INKS[d.primary].hex, flip, w, h), x, 0);
    if (inline) ctx.drawImage(tinted(inline, INKS[d.accent].hex, flip, w, h), x, 0);
    x += w + gap;
  });
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
