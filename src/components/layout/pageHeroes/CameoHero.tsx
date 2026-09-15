"use client";

import { useState } from "react";
import { DINO_ARM, DINO_EYE, dinoCells } from "@/components/brand/dino-pixels";
import { ProcessScene, StepStore, type Stage } from "@/components/home/ProcessScene";
import { SCENE, TREX_ORIGIN } from "@/components/home/ProcessSprites";
import { PageHeroContent, PageHeroSection } from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { usePageKey, type PageKey } from "@/components/layout/pageHeroes/usePageKey";

/** Which process dinosaur each page gets; Contact has its own (the letter, below). */
const CAMEO: Record<PageKey, Stage | "mail"> = {
  projects: "detective",
  about: "party",
  students: "builder",
  nonprofits: "team",
  contact: "mail",
};

/* ------------------------------------------------------------------ the letter carrier */

/** An envelope, its flap in green; held where the party dino holds its gift. */
const ENVELOPE = ["ooooooooo", "o#ooooo#o", "oo#ooo#oo", "ooo#o#ooo", "oooo#oooo", "ooooooooo"];
const ENVELOPE_AT = { x: 19, y: 8 } as const;
/** The arm held out (as the party dino's) and the cell it gains as it pushes the letter forward. */
const ARM_OUT: [number, number][] = [
  [16, 10],
  [17, 10],
  [18, 10],
  [16, 11],
  [17, 11],
  [18, 11],
];
const ARM_REACH: [number, number][] = [
  [19, 10],
  [19, 11],
];

const cell = (x: number, y: number, fill: string) => (
  <rect
    key={`${x}-${y}`}
    x={TREX_ORIGIN.x + x}
    y={TREX_ORIGIN.y + y}
    width={1}
    height={1}
    fill={fill}
  />
);

/**
 * Contact's cameo: the T-rex holding a letter out, on the process scene's stage and grid, with
 * the party dino's motion (the letter pushed a cell forward as the arm gains a cell).
 */
function MailScene() {
  return (
    <div aria-hidden="true" className="relative aspect-[8/5] w-full select-none">
      <svg
        viewBox={`0 0 ${SCENE.cols} ${SCENE.rows}`}
        shapeRendering="crispEdges"
        focusable="false"
        data-dino=""
        data-mode="party"
        className="absolute inset-0 size-full overflow-visible"
      >
        <g>
          {dinoCells({ withoutArm: true }).map(({ x, y }) => cell(x, y, "var(--green)"))}
          {DINO_ARM.map(([x, y]) => cell(x, y, "var(--green)"))}
          {ARM_OUT.map(([x, y]) => cell(x, y, "var(--green)"))}
          <rect
            className="anim-eyelid"
            x={TREX_ORIGIN.x + DINO_EYE.x}
            y={TREX_ORIGIN.y + DINO_EYE.y}
            width={1}
            height={1}
            fill="var(--green)"
          />
        </g>
        <g className="anim-dino-offer">
          {ENVELOPE.flatMap((row, y) =>
            Array.from(row).map((ch, x) =>
              cell(
                ENVELOPE_AT.x + x,
                ENVELOPE_AT.y + y,
                ch === "#" ? "var(--green)" : "var(--text)",
              ),
            ),
          )}
        </g>
        <g className="anim-dino-reach" opacity={0}>
          {ARM_REACH.map(([x, y]) => cell(x, y, "var(--green)"))}
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ the hero */

/**
 * "Cameo": one of the process dinosaurs walks in along a hairline ground under the headline and
 * stays, dressed for the page: the detective with its magnifying glass on Projects, the party
 * host with the gift on About, the builder hammering bricks on Students, the lead with its pink
 * and blue teammates on Nonprofits, and a letter carrier on Contact. The scenes are the home
 * page's (home/ProcessScene, held on one step so that step's own motion runs), drawn at a whole
 * number of pixels per cell with the walk in whole cells (steps), so nothing blurs. Under
 * reduced motion the dinosaur is standing in place with its prop. Decoration only.
 */
export function CameoHero(props: PageHeroProps) {
  const key = usePageKey();
  const stage = CAMEO[key ?? "projects"];
  const [store] = useState(() => new StepStore());

  return (
    <PageHeroSection className="grid-overlay border-b border-line [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroContent {...props} className="pb-56 md:pb-64" />

      {/* the ground the dinosaur walks in on */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-10 block h-px bg-line-strong"
      />
      {/* The stage's feet are on row 33 of 40, so the stage hangs six rows below the ground. */}
      <div
        aria-hidden="true"
        className="anim-page-walk pointer-events-none absolute bottom-[calc(2.5rem-6*var(--dino-cell))] left-[calc(var(--gutter)-2*var(--dino-cell))] [--dino-cell:5px] md:[--dino-cell:6px]"
        style={{ width: `calc(var(--dino-cell) * ${SCENE.cols})` }}
      >
        <div className="anim-page-step">
          {stage === "mail" ? (
            <MailScene />
          ) : (
            <ProcessScene stages={[stage]} step={0} store={store} />
          )}
        </div>
      </div>
    </PageHeroSection>
  );
}
