// Copies MediaPipe's WebAssembly runtime into public/olympus/mediapipe, where the family reveal's
// face finder (components/olympus/journey/faces.ts) loads it. 26 MB, so it is copied at install and
// build time rather than committed (the folder is git-ignored). The model, small, is committed:
// public/olympus/blaze-face.tflite.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const from = join(process.cwd(), "node_modules", "@mediapipe", "tasks-vision", "wasm");
const to = join(process.cwd(), "public", "olympus", "mediapipe");
const files = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

mkdirSync(to, { recursive: true });
for (const file of files) {
  if (!existsSync(join(from, file))) throw new Error(`@mediapipe/tasks-vision has no wasm/${file}`);
  copyFileSync(join(from, file), join(to, file));
}
console.log(`copy-mediapipe: ${files.length} files → public/olympus/mediapipe`);
