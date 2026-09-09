"use client";

import { PartnerGlobe } from "@/components/globe/PartnerGlobe";
import { GraphicFrame } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/**
 * "Globe": the partner globe from the Nonprofits page, with a pin per partner location.
 * Drag it in any direction; hover a pin and the globe holds still while a label names the
 * place (the state for a partner in the US, the country elsewhere; 2026-09-09 review), then
 * spins on when the pointer leaves. The frame's pointer tilt and bob are off
 * (the globe has its own motion, and a CSS translate moving the WebGL canvas by fractions of
 * a pixel made its hairlines and land dots shimmer, 2026-09-09 review) and its glow is the
 * globe's own, so the globe sits exactly centred beside the copy. The SVG globe renders first and
 * the three.js scene fades in over it once the section is near the viewport; under
 * prefers-reduced-motion the globe stands still and only a drag turns it.
 */
export function GlobeGraphic({ pins, className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame tilt={false} float={false} glow={false} className={className}>
      {() => <PartnerGlobe pins={pins} activeId={null} className="absolute inset-0" />}
    </GraphicFrame>
  );
}
