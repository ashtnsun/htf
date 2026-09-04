/**
 * Validates every content file against its Zod schema. Runs before `next build`
 * (see the `build` script) so a bad frontmatter field fails fast with a readable error.
 *
 *   pnpm validate:content
 */
import { validateAllContent } from "../src/lib/content";

try {
  const { counts } = validateAllContent();
  const summary = Object.entries(counts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  console.log(`✔ content valid (${summary})`);
} catch (error) {
  console.error("✖ content validation failed\n");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
