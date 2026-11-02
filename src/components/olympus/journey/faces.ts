import type { FaceDetector } from "@mediapipe/tasks-vision";
import type { Face } from "@/components/olympus/journey/save";

/**
 * Finds the faces in the family photo, on the laptop itself (MediaPipe's BlazeFace; the photo
 * never leaves the browser). The runtime is copied into public/olympus/mediapipe at install
 * (scripts/copy-mediapipe.mjs) and the model is public/olympus/blaze-face.tflite; both load
 * only on the photo step.
 *
 * BlazeFace looks at a small square, so a whole group photo hides the faces at the back. The
 * photo is searched whole and then in overlapping tiles at three finer scales, and the finds
 * merged: a face cut by a tile's edge is dropped there (a neighbouring tile holds it whole),
 * and of two boxes that mostly overlap, the surer one stays.
 */

let finder: Promise<FaceDetector> | null = null;

export function loadFaceFinder() {
  finder ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/olympus/mediapipe");
    const options = (delegate: "GPU" | "CPU") => ({
      baseOptions: { modelAssetPath: "/olympus/blaze-face.tflite", delegate },
      runningMode: "IMAGE" as const,
      minDetectionConfidence: 0.5,
    });
    try {
      return await FaceDetector.createFromOptions(fileset, options("GPU"));
    } catch {
      return FaceDetector.createFromOptions(fileset, options("CPU"));
    }
  })();
  finder.catch(() => {
    finder = null;
  });
  return finder;
}

type Found = Face & { score: number };

/** The share of the smaller box that the two boxes have in common. */
function overlap(a: Face, b: Face) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return (x * y) / Math.min(a.w * a.h, b.w * b.h);
}

/** Tiles of an n × n grid over a w × h image, each 1.5 times a cell so neighbours overlap. */
function tiles(n: number, w: number, h: number) {
  if (n === 1) return [{ x: 0, y: 0, w, h }];
  const tw = Math.min(w, (w / n) * 1.5);
  const th = Math.min(h, (h / n) * 1.5);
  const out = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      out.push({ x: ((w - tw) * i) / (n - 1), y: ((h - th) * j) / (n - 1), w: tw, h: th });
    }
  }
  return out;
}

/**
 * The faces in `photo`, left to right, as fractions of its size. `fine` searches the finer
 * tiles too (the still photo); without it, the whole frame and a 2 × 2 grid (the live preview).
 */
export async function findFaces(photo: HTMLCanvasElement, fine = true): Promise<Face[]> {
  const detector = await loadFaceFinder();
  const W = photo.width;
  const H = photo.height;
  const tile = document.createElement("canvas");
  const ctx = tile.getContext("2d")!;
  const found: Found[] = [];

  for (const n of fine ? [1, 2, 3, 4] : [1, 2]) {
    for (const t of tiles(n, W, H)) {
      // Each tile at no more than 640 across: enough for BlazeFace, quick to search.
      const k = Math.min(1, 640 / t.w);
      tile.width = Math.round(t.w * k);
      tile.height = Math.round(t.h * k);
      ctx.drawImage(photo, t.x, t.y, t.w, t.h, 0, 0, tile.width, tile.height);
      for (const d of detector.detect(tile).detections) {
        const b = d.boundingBox;
        const score = d.categories[0]?.score ?? 0;
        if (!b || score < (n > 2 ? 0.62 : 0.5)) continue;
        const m = 3;
        const cut =
          (b.originX < m && t.x > 0) ||
          (b.originY < m && t.y > 0) ||
          (b.originX + b.width > tile.width - m && t.x + t.w < W - 1) ||
          (b.originY + b.height > tile.height - m && t.y + t.h < H - 1);
        if (cut) continue;
        found.push({
          x: (t.x + b.originX / k) / W,
          y: (t.y + b.originY / k) / H,
          w: b.width / k / W,
          h: b.height / k / H,
          score,
        });
      }
    }
  }

  const kept: Found[] = [];
  for (const f of found.sort((a, b) => b.score - a.score)) {
    if (kept.every((k) => overlap(k, f) < 0.45)) kept.push(f);
  }
  return kept
    .map(({ x, y, w, h }) => ({ x, y, w, h }))
    .sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2));
}
