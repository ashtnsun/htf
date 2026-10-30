"use client";

import {
  Check,
  Copy,
  Download,
  RotateCcw,
  Save,
  Shuffle,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BACKDROPS,
  BACK_PIECES,
  CORDS,
  DEFAULT_DESIGN,
  INKS,
  LINES,
  LOOKS,
  MARKS,
  SLEEVE_SPANS,
  TECHNIQUES,
  ZIPPERS,
  normalizeDesign,
  type Design,
  type InkId,
  type MarkId,
} from "./design";
import { CLOSE_UP, VIEW_H, VIEW_W } from "./garment";
import { artworkPng, generateCached, processUpload, withUploads, type Uploads } from "./art";
import { HoodieMockup } from "./HoodieMockup";

/**
 * The merch studio (/merch): a washed black oversized zip-up with a cybersigil piece that
 * runs down both sleeves and joins across the back, built from a seed and a handful of
 * choices (density, thorns, weight, motifs, inks, print technique, wash, hardware) and the
 * small HTF marks. Shows front, back, both or a close-up of the shoulder; exports the mockup
 * as PNG and the flat artwork as SVG; designs save in this browser. Client only
 * (MerchStudioLoader), since it reads localStorage while its state is set up.
 */

const CURRENT_KEY = "htf-merch-current";
const SAVED_KEY = "htf-merch-saved";
const UPLOAD_KEYS = { sleeve: "htf-merch-upload-sleeve", back: "htf-merch-upload-back" } as const;

type View = "both" | "front" | "back" | "close";
const VIEWS: Record<View, string> = {
  both: "Both",
  front: "Front",
  back: "Back",
  close: "Close-up",
};
type Saved = { name: string; design: Design };

const btn =
  "hover-corners inline-flex h-11 min-w-11 items-center justify-center gap-2 border border-line bg-bg px-3 text-body text-text transition-colors hover:border-line-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: the design still works for this visit.
  }
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Rasterises the SVGs side by side at `scale` and saves them as one PNG. */
async function exportPng(svgs: SVGSVGElement[], boxes: [number, number][], name: string) {
  const scale = 2;
  const width = boxes.reduce((s, [w]) => s + w, 0) * scale;
  const height = Math.max(...boxes.map(([, h]) => h)) * scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let x = 0;
  for (const [i, svg] of svgs.entries()) {
    const [w, h] = boxes[i]!;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(w * scale));
    clone.setAttribute("height", String(h * scale));
    const src = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
    );
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("render failed"));
      img.src = src;
    });
    ctx.drawImage(img, x, 0, w * scale, h * scale);
    URL.revokeObjectURL(src);
    x += w * scale;
  }
  canvas.toBlob((b) => b && download(b, name), "image/png");
}

export function MerchStudio() {
  const [design, setDesign] = useState<Design>(() =>
    normalizeDesign(load(CURRENT_KEY, DEFAULT_DESIGN)),
  );
  const [view, setView] = useState<View>("both");
  const [saved, setSaved] = useState<Saved[]>(() =>
    load<Saved[]>(SAVED_KEY, []).map((s) => ({ name: s.name, design: normalizeDesign(s.design) })),
  );
  const [uploads, setUploads] = useState<Uploads>(() => ({
    sleeve: load(UPLOAD_KEYS.sleeve, null),
    back: load(UPLOAD_KEYS.back, null),
  }));
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);

  useEffect(() => store(CURRENT_KEY, design), [design]);
  useEffect(() => store(SAVED_KEY, saved), [saved]);
  useEffect(() => {
    store(UPLOAD_KEYS.sleeve, uploads.sleeve);
    store(UPLOAD_KEYS.back, uploads.back);
  }, [uploads]);

  // The drawing redraws only when a choice that shapes it changes, and a beat behind the
  // controls, so dragging a slider stays smooth.
  const drawing = useDeferredValue(design);
  const art = withUploads(generateCached(drawing), uploads, design);

  const set = <K extends keyof Design>(key: K, value: Design[K]) =>
    setDesign((d) => ({ ...d, [key]: value }));
  const setMark = (key: MarkId, on: boolean) =>
    setDesign((d) => ({ ...d, marks: { ...d.marks, [key]: on } }));
  const say = (text: string) => {
    setStatus(text);
    setTimeout(() => setStatus(""), 2500);
  };

  const onPng = async () => {
    const full: [number, number] = [VIEW_W, VIEW_H];
    const [, , cw, ch] = CLOSE_UP.split(" ").map(Number);
    const svgs =
      view === "both"
        ? [frontRef.current, backRef.current]
        : view === "front"
          ? [frontRef.current]
          : [backRef.current];
    const boxes: [number, number][] =
      view === "both" ? [full, full] : view === "close" ? [[cw!, ch!]] : [full];
    if (svgs.some((s) => !s)) return;
    try {
      await exportPng(svgs as SVGSVGElement[], boxes, `htf-zipup-${design.seed}-${view}.png`);
    } catch {
      say("The PNG could not be made in this browser.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div role="group" aria-label="View" className="mb-4 flex flex-wrap gap-1">
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(btn, view === v && "border-green text-green")}
            >
              {VIEWS[v]}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "grid gap-px border border-line bg-line",
            view === "both" && "sm:grid-cols-2",
          )}
        >
          {view !== "back" && view !== "close" ? (
            <HoodieMockup
              design={design}
              art={art}
              view="front"
              ref={frontRef}
              className="block h-auto w-full"
            />
          ) : null}
          {view !== "front" ? (
            <HoodieMockup
              design={design}
              art={art}
              view="back"
              closeUp={view === "close"}
              ref={backRef}
              className="block h-auto w-full"
            />
          ) : null}
        </div>
        <p className="mt-3 text-body text-muted">
          A mockup, not a print file. The artwork export is the drawing in flat ink on a transparent
          PNG, for a printer to separate.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Panel title="Look" id="merch-look">
          <div className="flex flex-wrap gap-2">
            {LOOKS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={btn}
                onClick={() => setDesign((d) => ({ ...d, ...l.patch }))}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Sigil" id="merch-sigil">
          <div className="flex gap-2">
            <label className="flex flex-1 items-center gap-2 text-body text-muted">
              Seed
              <input
                type="number"
                value={design.seed}
                min={1}
                onChange={(e) => set("seed", Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                className="h-11 w-full min-w-0 border border-line bg-bg px-3 text-text"
              />
            </label>
            <button
              type="button"
              className={btn}
              onClick={() => set("seed", 1 + Math.floor(Math.random() * 99999))}
            >
              <Shuffle className="size-4.5" aria-hidden />
              New
            </button>
          </div>
          <Slider label="Density" value={design.density} onChange={(v) => set("density", v)} />
          <Slider label="Thorns" value={design.thorns} onChange={(v) => set("thorns", v)} />
          <Slider label="Weight" value={design.weight} onChange={(v) => set("weight", v)} />
          <Choice
            label="Line"
            options={LINES}
            value={design.line}
            onChange={(v) => set("line", v)}
          />
          <div className="mt-4 grid grid-cols-2 gap-x-4">
            <Toggle label="Wing ribs" checked={design.ribs} onChange={(v) => set("ribs", v)} />
            <Toggle label="Lattice" checked={design.lattice} onChange={(v) => set("lattice", v)} />
            <Toggle label="Holed beads" checked={design.beads} onChange={(v) => set("beads", v)} />
            <Toggle
              label="Needle tips"
              checked={design.needles}
              onChange={(v) => set("needles", v)}
            />
            <Toggle
              label="Mirror sleeves"
              checked={design.mirror}
              onChange={(v) => set("mirror", v)}
            />
          </div>
        </Panel>

        <Panel title="Placement" id="merch-placement">
          <Choice
            label="Back"
            options={BACK_PIECES}
            value={design.back}
            onChange={(v) => set("back", v)}
          />
          <Choice
            label="Sleeves"
            options={
              Object.fromEntries(
                Object.entries(SLEEVE_SPANS).map(([k, v]) => [k, v.label]),
              ) as Record<keyof typeof SLEEVE_SPANS, string>
            }
            value={design.span}
            onChange={(v) => set("span", v)}
          />
        </Panel>

        <Panel title="Print" id="merch-print">
          <Choice
            label="Technique"
            options={TECHNIQUES}
            value={design.technique}
            onChange={(v) => set("technique", v)}
          />
          <Inks label="Ink" value={design.primary} onChange={(v) => set("primary", v)} />
          <Inks
            label="Inline and accent ink"
            value={design.accent}
            onChange={(v) => set("accent", v)}
          />
          <Slider label="Distress" value={design.distress} onChange={(v) => set("distress", v)} />
        </Panel>

        <Panel title="Garment" id="merch-garment">
          <Slider label="Wash" value={design.wash} onChange={(v) => set("wash", v)} />
          <Choice
            label="Zipper"
            options={
              Object.fromEntries(Object.entries(ZIPPERS).map(([k, v]) => [k, v.label])) as Record<
                keyof typeof ZIPPERS,
                string
              >
            }
            value={design.zipper}
            onChange={(v) => set("zipper", v)}
          />
          <Choice
            label="Drawcords"
            options={CORDS}
            value={design.cords}
            onChange={(v) => set("cords", v)}
          />
          <Choice
            label="Backdrop"
            options={BACKDROPS}
            value={design.backdrop}
            onChange={(v) => set("backdrop", v)}
          />
        </Panel>

        <Panel title="HTF mark" id="merch-mark">
          {(Object.keys(MARKS) as MarkId[]).map((k) => (
            <Toggle
              key={k}
              label={MARKS[k]}
              checked={design.marks[k]}
              onChange={(v) => setMark(k, v)}
            />
          ))}
          <Choice
            label="Colour"
            options={{ tonal: "Tonal", accent: "Ornament ink" }}
            value={design.markInk}
            onChange={(v) => set("markInk", v)}
          />
        </Panel>

        <Panel title="Your artwork" id="merch-upload">
          <p className="text-body text-muted">
            Art the club drew, commissioned or licensed: black on white, white on black or a
            transparent PNG. It prints in the first ink, in place of the generated piece.
          </p>
          {(["sleeve", "back"] as const).map((slot) => (
            <div key={slot} className="mt-4">
              <p className="mb-2 text-body text-muted">
                {slot === "sleeve" ? "Sleeves" : "Back"}:{" "}
                <span className="text-text">{uploads[slot] ? "your artwork" : "generated"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <label
                  className={cn(
                    btn,
                    "cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-mint",
                  )}
                >
                  <UploadIcon className="size-4.5" aria-hidden />
                  Upload {slot === "sleeve" ? "sleeve" : "back"} art
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const u = await processUpload(file);
                        setUploads((all) => ({ ...all, [slot]: u }));
                        say("Artwork placed.");
                      } catch (err) {
                        say(err instanceof Error ? err.message : "Could not read that image.");
                      }
                    }}
                  />
                </label>
                {uploads[slot] ? (
                  <button
                    type="button"
                    className={btn}
                    onClick={() => setUploads((all) => ({ ...all, [slot]: null }))}
                  >
                    Use generated
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {uploads.back ? (
            <>
              <Slider
                label="Back art size"
                value={design.uploadScale}
                onChange={(v) => set("uploadScale", Math.max(0.2, v))}
              />
              <Slider
                label="Back art height"
                value={design.uploadY}
                onChange={(v) => set("uploadY", v)}
              />
            </>
          ) : null}
        </Panel>

        <Panel title="Export and save" id="merch-export">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={btn} onClick={onPng}>
              <Download className="size-4.5" aria-hidden />
              PNG
            </button>
            <button
              type="button"
              className={btn}
              onClick={async () => {
                say("Drawing the artwork…");
                const blob = await artworkPng(design, uploads);
                if (blob) download(blob, `htf-sigil-${design.seed}.png`);
                say(blob ? "Artwork saved." : "The artwork could not be made here.");
              }}
            >
              <Download className="size-4.5" aria-hidden />
              Artwork
            </button>
            <button
              type="button"
              className={btn}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(design));
                  say("Settings copied.");
                } catch {
                  say("The clipboard is blocked here.");
                }
              }}
            >
              <Copy className="size-4.5" aria-hidden />
              Settings
            </button>
            <button type="button" className={btn} onClick={() => setDesign(DEFAULT_DESIGN)}>
              <RotateCcw className="size-4.5" aria-hidden />
              Reset
            </button>
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = name.trim() || `Seed ${design.seed}`;
              setSaved((s) => [{ name: n, design }, ...s.filter((x) => x.name !== n)]);
              setName("");
              say(`Saved “${n}”.`);
            }}
          >
            <label htmlFor="merch-name" className="sr-only">
              Name
            </label>
            <input
              id="merch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Seed ${design.seed}`}
              className="h-11 w-full min-w-0 border border-line bg-bg px-3 text-body text-text"
            />
            <button type="submit" className={btn}>
              <Save className="size-4.5" aria-hidden />
              Save
            </button>
          </form>
          <p role="status" className="mt-2 min-h-6 text-body text-muted">
            {status}
          </p>
          {saved.length ? (
            <ul className="mt-2 border-t border-line">
              {saved.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between gap-2 border-b border-line"
                >
                  <button
                    type="button"
                    onClick={() => setDesign(s.design)}
                    className="min-h-11 flex-1 truncate text-left text-body text-text transition-colors hover:text-green"
                  >
                    {s.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => setSaved((all) => all.filter((x) => x.name !== s.name))}
                    className="inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-green"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="border border-line bg-surface p-5">
      <h2 id={id} className="mb-4 text-eyebrow font-medium text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mt-4 block text-body text-muted">
      <span className="flex justify-between">
        {label}
        <span className="text-text tabular-nums">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-6 w-full accent-green"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center border border-line-strong bg-bg text-bg transition-colors peer-checked:border-green peer-checked:bg-green peer-focus-visible:outline-2 peer-focus-visible:outline-mint"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      {label}
    </label>
  );
}

function Choice<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<K, string>;
  value: K;
  onChange: (v: K) => void;
}) {
  return (
    <div role="group" aria-label={label} className="mt-4">
      <p className="mb-2 text-body text-muted">{label}</p>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(options) as K[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className={cn(btn, "px-2.5", value === k && "border-green text-green")}
          >
            {options[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Inks({
  label,
  value,
  onChange,
}: {
  label: string;
  value: InkId;
  onChange: (v: InkId) => void;
}) {
  return (
    <div role="group" aria-label={label} className="mt-4">
      <p className="mb-2 text-body text-muted">
        {label}: <span className="text-text">{INKS[value].label}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(INKS) as InkId[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={value === k}
            aria-label={INKS[k].label}
            title={INKS[k].label}
            onClick={() => onChange(k)}
            className={cn(
              "flex size-11 items-center justify-center border transition-colors",
              value === k ? "border-green" : "border-line hover:border-line-strong",
            )}
          >
            <span className="size-6 border border-line" style={{ backgroundColor: INKS[k].hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}
