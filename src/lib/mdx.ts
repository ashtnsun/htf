/**
 * Small helpers shared by the MDX renderer and the pages that read MDX sources.
 * Pure string functions: safe to import from server and client code.
 */

/** "What we built" -> "what-we-built". Used for heading ids and in-page links. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type MdxHeading = { id: string; text: string; level: 2 | 3 };

/** Strip the inline markdown that can appear in a heading (emphasis, code, links). */
function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

/**
 * Lists the `##` (and optionally `###`) headings of an MDX source, in order, with the same
 * ids the renderer assigns. Fenced code blocks are skipped.
 */
export function extractHeadings(source: string, levels: (2 | 3)[] = [2]): MdxHeading[] {
  const headings: MdxHeading[] = [];
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const level = match[1]!.length as 2 | 3;
    if (!levels.includes(level)) continue;
    const text = plainText(match[2]!);
    headings.push({ id: slugify(text), text, level });
  }
  return headings;
}
