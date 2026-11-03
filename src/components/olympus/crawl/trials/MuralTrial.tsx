"use client";

import { useLayoutEffect, useRef } from "react";
import { Mural } from "@/components/olympus/journey/Mural";
import { Portrait, type PortraitResult } from "@/components/olympus/journey/Portrait";
import type { Face } from "@/components/olympus/journey/save";

/**
 * The mural, on the wall of the room: no page of its own. The frame below sits exactly over the
 * mural's picture in the world (the shell moves the camera to make it so, through `onFrame`), so
 * the bare wall shows through it, then the live camera, then the photo with the faces marked and
 * the names asked for, all in place. Once it is done, this is only the photo with the names under
 * it, which the wheels will want again.
 */
export function MuralTrial({
  photo,
  faces,
  names,
  onDone,
  onFrame,
}: {
  photo: string | null;
  faces: Face[];
  names: string[];
  onDone: (result: PortraitResult) => void;
  /** Where the frame is on screen: the world lines the mural up under it. */
  onFrame: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const frame = ref.current?.querySelector("[data-frame]");
      if (frame) onFrame(frame.getBoundingClientRect());
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [onFrame]);

  return (
    <div ref={ref} className="crawl-portrait">
      {photo && names.length ? (
        <div className="portrait-stage">
          <div />
          <div data-frame className="w-full">
            <div className="relative aspect-video w-full overflow-hidden">
              <Mural photo={photo} faces={faces} names={names} />
            </div>
          </div>
          <div />
        </div>
      ) : (
        <Portrait unnumbered inWorld doneLabel="Set it in the wall" onDone={onDone} />
      )}
    </div>
  );
}
