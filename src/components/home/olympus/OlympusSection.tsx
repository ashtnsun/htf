import { cinzel } from "@/components/olympus/fonts";
import { OlympusScene } from "./OlympusScene";

/**
 * The home page's way into /olympus, between the hero and "What do we do?": the T-rex looking
 * at Mount Olympus (OlympusScene), centred on the black page under its heading in the reveal's
 * Cinzel capitals.
 */
export function OlympusSection() {
  return (
    <section
      id="olympus"
      aria-labelledby="olympus-title"
      className={`${cinzel.variable} container-x py-20 md:py-28`}
    >
      <OlympusScene />
    </section>
  );
}
