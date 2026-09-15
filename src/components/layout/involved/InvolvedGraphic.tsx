import { GlobeGraphic } from "@/components/layout/involved/GlobeGraphic";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/**
 * The Get involved graphic: the partner globe (GlobeGraphic). Terminal, Chat and Badge stay
 * on /dev/ui only since the Shift + M menu was removed (2026-09-15).
 */
export function InvolvedGraphic(props: InvolvedGraphicProps) {
  return <GlobeGraphic {...props} />;
}
