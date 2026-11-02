"""
Compose Slack logos from the Cunia outlines, set exactly like the <HTF/> wordmark
(scripts/gen-logo-paths.py: same tracking, pair pulls, bracket and slash scaling, letters
in --green, brackets / slash / hash in --green-deep), on a black background.

Usage:  python scripts/gen-slack-logos.py      (then node scripts/render-slack-logos.mjs)
Needs:  pip install fonttools
Writes: reference/branding/Slack/*.svg
"""
from __future__ import annotations

import importlib.util
import io
import zipfile
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reference/branding/Slack"

spec = importlib.util.spec_from_file_location("logo", ROOT / "scripts/gen-logo-paths.py")
logo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(logo)

GREEN, DEEP, BG = "#03C652", "#277D4A", "#000000"
LINE_GAP = 160  # between stacked lines, font units
# Pairs the HTF wordmark never meets: L's foot runs under A, K's leg meets the slash.
KERN = {"LA": 70, "K/": 60}

font = TTFont(io.BytesIO(zipfile.ZipFile(logo.ZIP).read("Cunia.ttf")))
cmap, gs = font.getBestCmap(), font.getGlyphSet()


def line(seq: str) -> tuple[list[tuple[str, str]], float]:
    """One line of type: [(fill, d)] in y-down font units (baseline 0), and its width."""
    x, out = 0.0, []
    for i, ch in enumerate(seq):
        g = gs[cmap[ord(ch)]]
        pen, bp = SVGPathPen(gs), BoundsPen(gs)
        g.draw(pen)
        g.draw(bp)
        x0, y0, x1, y1 = bp.bounds
        s, dy = 1.0, 0.0
        if ch in logo.SCALE_TO:
            t0, t1 = logo.SCALE_TO[ch]
            s = (t1 - t0) / (y1 - y0)
            dy = t0 - y0 * s
        fx = lambda v, s=s, x0=x0, x=x: (v - x0) * s + x0 + x
        fy = lambda v, s=s, dy=dy: -(v * s + dy)
        fill = GREEN if ch.isalpha() else DEEP
        out.append((fill, logo.emit(logo.parse_abs(pen.getCommands()), fx, fy)))
        # The wordmark pulls "F/" together; any letter before the slash gets the same pull.
        nxt = seq[i + 1] if i + 1 < len(seq) else ""
        pull = logo.PAIR_ADJUST.get(ch, 0) if ch in "</" else (-30 if nxt == "/" else 0)
        x += g.width * s + logo.TRACKING + pull + KERN.get(ch + nxt, 0)
    return out, x - logo.TRACKING


def ink_bounds(paths: list[tuple[str, str]]) -> tuple[float, float]:
    xs = []
    for _, d in paths:
        for c, nums in logo.parse_abs(d):
            xs += nums[0::2]
    return min(xs), max(xs)


def svg(w: int, h: int, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
        f'<rect width="{w}" height="{h}" fill="{BG}"/>{body}</svg>\n'
    )


def place(paths, tx: float, ty: float, scale: float) -> str:
    inner = "".join(f'<path fill="{f}" d="{d}"/>' for f, d in paths)
    return f'<g transform="translate({tx:.1f} {ty:.1f}) scale({scale:.4f})">{inner}</g>'


def centred_lines(seqs: list[str], w: int, h: int, fill_w: float) -> str:
    """Stack lines, centre each on its ink, scale the block to fill_w of the canvas width."""
    lines = [line(s)[0] for s in seqs]
    bounds = [ink_bounds(p) for p in lines]
    widest = max(b1 - b0 for b0, b1 in bounds)
    block_h = 740 * len(seqs) + LINE_GAP * (len(seqs) - 1)
    k = min(w * fill_w / widest, h * 0.72 / block_h)
    top = (h - block_h * k) / 2
    body = ""
    for i, (paths, (b0, b1)) in enumerate(zip(lines, bounds)):
        baseline = top + (720 + i * (740 + LINE_GAP)) * k
        body += place(paths, w / 2 - (b0 + b1) / 2 * k, baseline, k)
    return svg(w, h, body)


def dino_tile(size: int) -> str:
    """Idea: the site's pixel T-rex set inside the wordmark's brackets, <🦖/>, a square icon."""
    from re import findall

    src = (ROOT / "src/components/brand/dino-pixels.ts").read_text(encoding="utf-8")
    rows = findall(r'"([.#]{20})"', src)
    cell = 32  # font units; 22 rows = 704, the brackets' cap height is 700
    lt, _ = line("<")
    sl, _ = line("/>")
    lt_b, sl_b = ink_bounds(lt), ink_bounds(sl)
    gap = 70
    dino_x = lt_b[1] + gap
    # The slash's foot tucks under the head, where the dinosaur has nothing at the bottom.
    sl_dx = dino_x + 20 * cell - 90 - sl_b[0]
    rects = "".join(
        f'<rect x="{dino_x + c * cell}" y="{-712 + r * cell}" width="{cell}" height="{cell}"/>'
        for r, row in enumerate(rows)
        for c, v in enumerate(row)
        if v == "#"
    )
    total = sl_dx + sl_b[1] - lt_b[0]
    k = size * 0.84 / total
    tx = (size - total * k) / 2 - lt_b[0] * k
    ty = size / 2 + 350 * k
    inner = "".join(f'<path fill="{f}" d="{d}"/>' for f, d in lt)
    inner += f'<g fill="{GREEN}" shape-rendering="crispEdges">{rects}</g>'
    inner += f'<g transform="translate({sl_dx:.1f} 0)">' + "".join(
        f'<path fill="{f}" d="{d}"/>' for f, d in sl
    ) + "</g>"
    return svg(size, size, f'<g transform="translate({tx:.1f} {ty:.1f}) scale({k:.4f})">{inner}</g>')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "slack-wordmark.svg": centred_lines(["<SLACK/>"], 2400, 900, 0.8),
        "slack-stacked.svg": centred_lines(["<SLA", "CK/>"], 1200, 1200, 0.78),
        "idea-dino-tile.svg": dino_tile(1200),
        "idea-hash.svg": centred_lines(["<#HTF/>"], 2400, 900, 0.8),
    }
    for name, text in files.items():
        (OUT / name).write_text(text, encoding="utf-8")
        print(f"wrote {(OUT / name).relative_to(ROOT)}")


if __name__ == "__main__":
    main()
