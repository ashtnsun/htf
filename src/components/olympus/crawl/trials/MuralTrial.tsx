"use client";

import { Mural } from "@/components/olympus/journey/Mural";
import { Portrait, type PortraitResult } from "@/components/olympus/journey/Portrait";
import type { Face } from "@/components/olympus/journey/save";

/**
 * The mural, up close. Bare stone until the family stands in front of it: the same photo step as
 * /olympus (camera, faces found on the laptop, every first name), and once it is done the photo
 * goes up on the wall. Afterwards this is only the photo with the names under it, which the stone's
 * wheels will want again.
 */
export function MuralTrial({
  photo,
  faces,
  names,
  onDone,
}: {
  photo: string | null;
  faces: Face[];
  names: string[];
  onDone: (result: PortraitResult) => void;
}) {
  if (photo && names.length) {
    return (
      <div className="crawl-mural-view">
        <div className="journey-rise border border-line-strong bg-bg p-2">
          <Mural photo={photo} faces={faces} names={names} />
        </div>
      </div>
    );
  }
  return (
    <div className="crawl-portrait">
      <Portrait unnumbered doneLabel="Set it in the wall" onDone={onDone} />
    </div>
  );
}
