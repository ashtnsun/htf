/**
 * The model behind the dinosaur editor (/dino): a sprite is a grid of cells, each empty (0)
 * or an index into its palette (1-based). As text it is the string-map format every pixel
 * picture on the site already uses (brand/dino-pixels, home/ProcessSprites): one string per
 * row, `.` for an empty cell and one character per colour, `#` first, `o` second, `+` third.
 * Every function here returns a new sprite; the editor keeps the old ones as its undo history.
 */
export type Sprite = {
  name: string;
  width: number;
  height: number;
  /** Hex colours (#rrggbb); cell value i means palette[i - 1]. */
  palette: string[];
  cells: number[];
};

/** The map character of each palette slot, in order: the codebase's `#`, `o`, `+`, then letters. */
export const INK_CHARS = "#o+abcdefghijklmnpqrstuvwxyz";
export const MAX_SIZE = 96;

/** The brand colours offered as swatches (globals.css); tint is green at 28% over the page. */
export const BRAND_COLORS: readonly { name: string; hex: string }[] = [
  { name: "Green", hex: "#03c652" },
  { name: "Green deep", hex: "#277d4a" },
  { name: "Mint", hex: "#00eb88" },
  { name: "Cyan", hex: "#00e0ff" },
  { name: "Lime", hex: "#c8ff3d" },
  { name: "Pink", hex: "#ff3d9e" },
  { name: "Blue", hex: "#3388ff" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Tint", hex: "#093f1f" },
  { name: "Surface", hex: "#1c1c1c" },
  { name: "Black", hex: "#0b0b0b" },
];

/** A sprite from a string map and the colour of each character (`.` and spaces are empty). */
export function fromRows(
  name: string,
  rows: readonly string[],
  inks: Readonly<Record<string, string>>,
): Sprite {
  const chars = Object.keys(inks);
  const width = Math.max(1, ...rows.map((row) => row.length));
  const cells: number[] = [];
  for (const row of rows) {
    for (let x = 0; x < width; x += 1) {
      const ch = row[x] ?? ".";
      cells.push(chars.indexOf(ch) + 1);
    }
  }
  return { name, width, height: rows.length, palette: chars.map((ch) => inks[ch]!), cells };
}

export function toRows(sprite: Sprite): string[] {
  const rows: string[] = [];
  for (let y = 0; y < sprite.height; y += 1) {
    let row = "";
    for (let x = 0; x < sprite.width; x += 1) {
      const v = sprite.cells[y * sprite.width + x]!;
      row += v === 0 ? "." : INK_CHARS[v - 1];
    }
    rows.push(row);
  }
  return rows;
}

function constName(name: string) {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `DINO_${slug || "VARIANT"}`;
}

/** The sprite as a TypeScript constant in the codebase's string-map format. */
export function toCode(sprite: Sprite): string {
  const palette = sprite.palette.map((hex, i) => `"${INK_CHARS[i]}": "${hex}"`).join(", ");
  const rows = toRows(sprite)
    .map((row) => `    "${row}",`)
    .join("\n");
  return [
    `// ${sprite.name}: ${sprite.width} × ${sprite.height} cells`,
    `export const ${constName(sprite.name)} = {`,
    `  palette: { ${palette} },`,
    `  rows: [`,
    rows,
    `  ],`,
    `} as const;`,
  ].join("\n");
}

/**
 * Reads what toCode writes, or any list of quoted string-map rows (a palette is optional:
 * without one `#` is green and `o` white, and any other character gets green too).
 */
export function parseCode(text: string, name: string): Sprite | null {
  const paletteMatches = [
    ...text.matchAll(/["']?([^\s"'.,:{}])["']?\s*:\s*["'](#[0-9a-fA-F]{6})["']/g),
  ];
  const inks: Record<string, string> = {};
  for (const [, ch, hex] of paletteMatches) inks[ch!] = hex!.toLowerCase();
  const rowsAt = text.search(/\brows\b/);
  const body = rowsAt >= 0 ? text.slice(rowsAt) : text;
  const rows = [...body.matchAll(/["']([^"'\n]+)["']/g)]
    .map(([, row]) => row!)
    .filter((row) => !/^#[0-9a-fA-F]{6}$/.test(row) && row !== "rows");
  if (rows.length === 0 || rows.length > MAX_SIZE) return null;
  if (Object.keys(inks).length === 0) Object.assign(inks, { "#": "#03c652", o: "#f5f5f5" });
  for (const row of rows) {
    for (const ch of row) {
      if (ch !== "." && ch !== " " && !(ch in inks)) inks[ch] = "#03c652";
    }
  }
  if (Math.max(...rows.map((row) => row.length)) > MAX_SIZE) return null;
  return fromRows(name, rows, inks);
}

/** Several sprites in one paste: their toCode blocks, a blank line between. */
export function toCodeAll(sprites: readonly Sprite[]): string {
  return `${sprites.map(toCode).join("\n\n")}\n`;
}

/** Reads what toCodeAll writes: one sprite per "// <name>: <w> × <h> cells" header. */
export function parseCodeAll(text: string): Sprite[] {
  const headers = [...text.matchAll(/^\s*\/\/\s*(.+?):\s*\d+\s*×.*$/gm)];
  return headers.flatMap((header, i) => {
    const body = text.slice(header.index + header[0].length, headers[i + 1]?.index);
    const sprite = parseCode(body, header[1]!);
    return sprite ? [sprite] : [];
  });
}

/** Grows (positive) or shrinks (negative) each edge by whole cells; the drawing stays put. */
export function resize(
  sprite: Sprite,
  edges: { top?: number; right?: number; bottom?: number; left?: number },
): Sprite {
  const { top = 0, right = 0, bottom = 0, left = 0 } = edges;
  const width = sprite.width + left + right;
  const height = sprite.height + top + bottom;
  if (width < 1 || height < 1 || width > MAX_SIZE || height > MAX_SIZE) return sprite;
  const cells = Array<number>(width * height).fill(0);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = x - left;
      const sy = y - top;
      if (sx >= 0 && sy >= 0 && sx < sprite.width && sy < sprite.height) {
        cells[y * width + x] = sprite.cells[sy * sprite.width + sx]!;
      }
    }
  }
  return { ...sprite, width, height, cells };
}

/** Moves the drawing by whole cells inside the same canvas; cells pushed past an edge are lost. */
export function shift(sprite: Sprite, dx: number, dy: number): Sprite {
  const { width, height } = sprite;
  const cells = Array<number>(width * height).fill(0);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = x - dx;
      const sy = y - dy;
      if (sx >= 0 && sy >= 0 && sx < width && sy < height) {
        cells[y * width + x] = sprite.cells[sy * width + sx]!;
      }
    }
  }
  return { ...sprite, cells };
}

export function flipX(sprite: Sprite): Sprite {
  const { width, height } = sprite;
  const cells = sprite.cells.slice();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      cells[y * width + x] = sprite.cells[y * width + (width - 1 - x)]!;
    }
  }
  return { ...sprite, cells };
}

/** Crops the canvas to the drawing, plus `pad` empty cells on every side. */
export function trim(sprite: Sprite, pad = 0): Sprite {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  sprite.cells.forEach((v, i) => {
    if (v === 0) return;
    const x = i % sprite.width;
    const y = Math.floor(i / sprite.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  if (maxX < 0) return sprite;
  return resize(sprite, {
    top: pad - minY,
    left: pad - minX,
    right: pad - (sprite.width - 1 - maxX),
    bottom: pad - (sprite.height - 1 - maxY),
  });
}

/** A rectangle of cells (it may reach past the canvas while it is being moved). */
export type Region = { x: number; y: number; w: number; h: number };

/**
 * Lifts the filled cells inside `region` and puts them down (dx, dy) cells away. Empty cells
 * in the region are see-through, so they never erase what they land on; cells moved past an
 * edge are dropped.
 */
export function moveRegion(sprite: Sprite, region: Region, dx: number, dy: number): Sprite {
  if (dx === 0 && dy === 0) return sprite;
  const { width, height } = sprite;
  const cells = sprite.cells.slice();
  const lifted: [number, number, number][] = [];
  for (let y = Math.max(0, region.y); y < Math.min(height, region.y + region.h); y += 1) {
    for (let x = Math.max(0, region.x); x < Math.min(width, region.x + region.w); x += 1) {
      const v = cells[y * width + x]!;
      if (v === 0) continue;
      lifted.push([x, y, v]);
      cells[y * width + x] = 0;
    }
  }
  for (const [x, y, v] of lifted) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < width && ny < height) cells[ny * width + nx] = v;
  }
  return { ...sprite, cells };
}

/** Empties every cell inside `region`. */
export function clearRegion(sprite: Sprite, region: Region): Sprite {
  const cells = sprite.cells.map((v, i) => {
    const x = i % sprite.width;
    const y = Math.floor(i / sprite.width);
    const inside =
      x >= region.x && y >= region.y && x < region.x + region.w && y < region.y + region.h;
    return inside ? 0 : v;
  });
  return { ...sprite, cells };
}

/** Paints one cell; returns the same sprite when nothing changes (so no undo step is made). */
export function paint(sprite: Sprite, x: number, y: number, value: number): Sprite {
  const i = y * sprite.width + x;
  if (x < 0 || y < 0 || x >= sprite.width || y >= sprite.height) return sprite;
  if (sprite.cells[i] === value) return sprite;
  const cells = sprite.cells.slice();
  cells[i] = value;
  return { ...sprite, cells };
}

/** Bucket fill: the four-connected region of the clicked cell's value. */
export function fill(sprite: Sprite, x: number, y: number, value: number): Sprite {
  const { width, height } = sprite;
  const target = sprite.cells[y * width + x];
  if (target === undefined || target === value) return sprite;
  const cells = sprite.cells.slice();
  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    if (cells[cy * width + cx] !== target) continue;
    cells[cy * width + cx] = value;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return { ...sprite, cells };
}

/** Removes a palette colour; its cells become empty and the later indices move down by one. */
export function removeColor(sprite: Sprite, index: number): Sprite {
  const palette = sprite.palette.filter((_, i) => i !== index);
  const cells = sprite.cells.map((v) => (v === index + 1 ? 0 : v > index + 1 ? v - 1 : v));
  return { ...sprite, palette, cells };
}

/** The sprite as an SVG file: one rect per horizontal run of a colour, crisp edges. */
export function toSvg(sprite: Sprite, scale = 1): string {
  const rects: string[] = [];
  for (let y = 0; y < sprite.height; y += 1) {
    let x = 0;
    while (x < sprite.width) {
      const v = sprite.cells[y * sprite.width + x]!;
      let run = 1;
      while (x + run < sprite.width && sprite.cells[y * sprite.width + x + run] === v) run += 1;
      if (v !== 0) {
        rects.push(
          `  <rect x="${x}" y="${y}" width="${run}" height="1" fill="${sprite.palette[v - 1]}"/>`,
        );
      }
      x += run;
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sprite.width} ${sprite.height}" width="${sprite.width * scale}" height="${sprite.height * scale}" shape-rendering="crispEdges">`,
    ...rects,
    `</svg>`,
    "",
  ].join("\n");
}

/** Draws the sprite at `scale` pixels per cell (transparent where a cell is empty). */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  scale: number,
  ox = 0,
  oy = 0,
) {
  sprite.cells.forEach((v, i) => {
    if (v === 0) return;
    ctx.fillStyle = sprite.palette[v - 1]!;
    ctx.fillRect(
      ox + (i % sprite.width) * scale,
      oy + Math.floor(i / sprite.width) * scale,
      scale,
      scale,
    );
  });
}

export function toPngBlob(sprite: Sprite, scale: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = sprite.width * scale;
  canvas.height = sprite.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  drawSprite(ctx, sprite, scale);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Sprites side by side on one PNG, two cells apart, standing on the same bottom edge, on the
 * site's dark background (a contact sheet to look at, so white props stay visible).
 */
export function toSheetPngBlob(sprites: readonly Sprite[], scale: number): Promise<Blob | null> {
  const gap = 2 * scale;
  const canvas = document.createElement("canvas");
  canvas.width = sprites.reduce((w, s) => w + s.width * scale + gap, gap);
  canvas.height = Math.max(...sprites.map((s) => s.height)) * scale + 2 * gap;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let x = gap;
  for (const s of sprites) {
    drawSprite(ctx, s, scale, x, canvas.height - gap - s.height * scale);
    x += s.width * scale + gap;
  }
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function fileSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "dino"
  );
}
