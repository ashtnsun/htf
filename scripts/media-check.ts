/**
 * Reports which image slot of the site still shows a placeholder, which real files are staged
 * in media/, and copies the staged ones into public/images/ on request.
 *
 *   pnpm media:check                    every slot: filled, staged, or still a placeholder
 *   pnpm media:check --import           copy staged files into public/, print the media.ts lines
 *   pnpm media:check --import --force   overwrite files already in public/
 *
 * The slots come from the content itself (projects, exec, awards, Instagram, testimonials), so
 * adding a project or a board member adds its slots here with no change to this script. Nothing
 * writes to content/media.ts: the lines are printed, you paste them.
 */
import fs from "node:fs";
import path from "node:path";
import { media, isMediaKey } from "../content/media";
import {
  getAllProjects,
  getExec,
  getAwards,
  getInstagramPosts,
  getTestimonials,
} from "../src/lib/content";

const ROOT = process.cwd();
const INTAKE = path.join(ROOT, "media");
const PUBLIC = path.join(ROOT, "public");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

const args = process.argv.slice(2);
const doImport = args.includes("--import");
const force = args.includes("--force");

type Slot = {
  area: string;
  /** The key in content/media.ts this file fills. */
  key: string;
  label: string;
  /** Path under media/, without an extension. */
  intake: string;
  /** Path under public/, without an extension. */
  target: string;
  spec: string;
};

/** A board year as a folder name: the content uses an en dash, folders use a hyphen. */
const yearDir = (year: string) => year.replace("–", "-");

const kebab = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function buildSlots(): Slot[] {
  const slots: Slot[] = [
    {
      area: "home",
      key: "org.group-photo",
      label: "club photo (home hero + About mission)",
      intake: "home/group-photo",
      target: "images/home/group-photo",
      spec: "landscape, >= 2560x1440",
    },
  ];

  for (const member of getExec()) {
    if (!member.photo) continue;
    slots.push({
      area: "exec",
      key: member.photo,
      label: `${member.name} - ${member.role} (${member.year})`,
      intake: `about/exec/${yearDir(member.year)}/${member.slug}`,
      target: `images/exec/${member.slug}`,
      spec: "portrait 4:5, >= 1000x1250",
    });
  }

  for (const post of getInstagramPosts()) {
    slots.push({
      area: "instagram",
      key: post.image,
      label: `Instagram tile ${post.id}`,
      intake: `about/instagram/${post.id}`,
      target: `images/instagram/${post.id}`,
      spec: "square, >= 1080x1080",
    });
  }

  for (const award of getAwards({ publishedOnly: false })) {
    award.photos.forEach((photo, i) => {
      slots.push({
        area: "awards",
        key: photo.src,
        label: `${award.title} - photo ${i + 1}`,
        intake: `awards/${award.id}/${i + 1}`,
        target: `images/awards/${award.id}-${i + 1}`,
        spec: "landscape 3:2, >= 1800x1200",
      });
    });
  }

  for (const project of getAllProjects()) {
    slots.push({
      area: "projects",
      key: project.cover,
      label: `${project.title} - cover`,
      intake: `projects/${project.slug}/cover`,
      target: `images/projects/${project.slug}/cover`,
      spec: "landscape 16:9, >= 2400x1350",
    });
    project.gallery.forEach((image, i) => {
      slots.push({
        area: "projects",
        key: image.src,
        label: `${project.title} - gallery ${i + 1}`,
        intake: `projects/${project.slug}/gallery-${i + 1}`,
        target: `images/projects/${project.slug}/gallery-${i + 1}`,
        spec: "landscape 16:10, >= 1920x1200",
      });
    });
    project.team.forEach((member) => {
      if (!member.avatar) return;
      slots.push({
        area: "people",
        key: member.avatar,
        label: `${member.name} - ${project.title} team avatar`,
        intake: `people/${kebab(member.name)}`,
        target: `images/people/${kebab(member.name)}`,
        spec: "square, >= 400x400",
      });
    });
  }

  for (const testimonial of getTestimonials({ publishedOnly: false })) {
    if (!testimonial.avatar) continue;
    slots.push({
      area: "people",
      key: testimonial.avatar,
      label: `${testimonial.name} - testimonial avatar`,
      intake: `people/${testimonial.id}`,
      target: `images/people/${testimonial.id}`,
      spec: "square, >= 400x400",
    });
  }

  return slots;
}

/** The staged file for a slot, if one was dropped under any accepted extension. */
function stagedFile(slot: Slot): string | undefined {
  for (const ext of EXTENSIONS) {
    const abs = path.join(INTAKE, `${slot.intake}${ext}`);
    if (fs.existsSync(abs)) return abs;
  }
  return undefined;
}

function currentValue(key: string): string | undefined {
  return isMediaKey(key) ? media[key] : undefined;
}

function listIntakeFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) out.push(abs);
    }
  };
  walk(INTAKE);
  return out;
}

const rel = (abs: string) => path.relative(ROOT, abs).replace(/\\/g, "/");

const slots = buildSlots();

// A key used by more than one slot cannot hold two different pictures.
const keyCount = new Map<string, number>();
for (const slot of slots) keyCount.set(slot.key, (keyCount.get(slot.key) ?? 0) + 1);

const filled: Slot[] = [];
const staged: { slot: Slot; file: string }[] = [];
const missing: Slot[] = [];

for (const slot of slots) {
  const value = currentValue(slot.key);
  const isPlaceholder = !value || value.startsWith("/placeholders/");
  const file = stagedFile(slot);
  if (file) staged.push({ slot, file });
  else if (isPlaceholder) missing.push(slot);
  else filled.push(slot);
}

function groupByArea<T>(items: T[], area: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(area(item)) ?? [];
    list.push(item);
    map.set(area(item), list);
  }
  return map;
}

console.log(
  `\nMedia slots: ${filled.length} filled, ${staged.length} staged in media/, ` +
    `${missing.length} still a placeholder\n`,
);

if (staged.length > 0) {
  console.log("Staged in media/ (ready to import):");
  for (const { slot, file } of staged) {
    console.log(`  ${slot.label}`);
    console.log(`    ${rel(file)}`);
  }
  console.log("");
}

if (missing.length > 0) {
  console.log("Waiting on a file - drop one at these paths:");
  for (const [area, items] of groupByArea(missing, (slot) => slot.area)) {
    console.log(`  ${area}`);
    for (const slot of items) {
      console.log(`    media/${slot.intake}.*   ${slot.spec}`);
      console.log(`      ${slot.label}`);
    }
  }
  console.log("");
}

const shared = [...keyCount.entries()].filter(([, count]) => count > 1);
if (shared.length > 0) {
  console.log("Keys shared by several slots. Each slot needs its own key in content/media.ts");
  console.log("before those slots can show different pictures:");
  for (const [key, count] of shared) console.log(`  ${key} - used by ${count} slots`);
  console.log("");
}

const stagedPaths = new Set(staged.map(({ file }) => file));
const unrecognized = listIntakeFiles().filter((file) => !stagedPaths.has(file));
if (unrecognized.length > 0) {
  console.log("In media/ but matching no slot (wrong name, wrong folder, or nothing uses it yet):");
  for (const file of unrecognized) console.log(`  ${rel(file)}`);
  console.log("");
}

if (!doImport) {
  if (staged.length > 0) {
    console.log("Run `pnpm media:check --import` to copy the staged files into public/.\n");
  }
  process.exit(0);
}

const lines: string[] = [];
let copied = 0;
let skipped = 0;

for (const { slot, file } of staged) {
  const ext = path.extname(file).toLowerCase();
  const dest = path.join(PUBLIC, `${slot.target}${ext}`);
  const url = `/${slot.target}${ext}`;
  if (fs.existsSync(dest) && !force) {
    console.log(`skip  ${rel(dest)} already there (--force to overwrite)`);
    skipped += 1;
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
    console.log(`copy  ${rel(file)} -> ${rel(dest)}`);
    copied += 1;
  }
  if (currentValue(slot.key) !== url) lines.push(`  "${slot.key}": "${url}",`);
}

console.log(`\n${copied} copied, ${skipped} skipped.`);

if (lines.length > 0) {
  console.log("\nPaste into content/media.ts, replacing the placeholder line for each key:\n");
  for (const line of [...new Set(lines)]) console.log(line);
  console.log("\nThen run `pnpm build`: it fails if a key points at a file that is not there.\n");
} else {
  console.log("content/media.ts already points at every imported file.\n");
}
