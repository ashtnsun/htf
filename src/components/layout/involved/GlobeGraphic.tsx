"use client";

import { PartnerGlobe } from "@/components/globe/PartnerGlobe";
import { GraphicFrame } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/**
 * "Globe": the partner globe from the Nonprofits page, with a pin per partner location.
 * Drag it in any direction; hover a pin and the globe holds still while a label names the
 * country, then spins on when the pointer leaves. The frame's pointer tilt is off (the globe
 * has its own pointer play) and its glow is the globe's own. The SVG globe renders first and
 * the three.js scene fades in over it once the section is near the viewport; under
 * prefers-reduced-motion the globe stands still and only a drag turns it.
 */
export function GlobeGraphic({ pins, className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame tilt={false} glow={false} className={className}>
      {() => <PartnerGlobe pins={pins} activeId={null} className="absolute inset-0" />}
    </GraphicFrame>
  );
}
