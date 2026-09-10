"use client";

import { useRef, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";

/**
 * How tall the frame has to be for the form's first section, per width. Nothing scrolls
 * inside the frame: a nested scrollbar was what Ashton asked to lose (2026-09-10), and a
 * frame the page scrolls through cannot trap the wheel either. The numbers are measured —
 * run `node scripts/measure-apply-form.mjs` against a production build after the form
 * changes and paste the new ones in. The narrower the column, the more each question wraps,
 * so every section runs taller.
 */
const FIRST_SECTION =
  "h-[2870px] min-[360px]:h-[2570px] min-[420px]:h-[2450px] min-[480px]:h-[2320px] min-[520px]:h-[2250px] min-[640px]:h-[2110px] min-[768px]:h-[2030px] min-[880px]:h-[1970px]";

/**
 * And for every section after it: the tallest of sections 2-5, which is always section 2
 * (the form is 8 questions, then 6, 4, 3, 3). One height covers all of them rather than one
 * per section, because the frame cannot tell which section it is showing — see below.
 */
const LATER_SECTIONS =
  "h-[2450px] min-[360px]:h-[2170px] min-[420px]:h-[1920px] min-[480px]:h-[1730px] min-[520px]:h-[1640px] min-[640px]:h-[1530px] min-[768px]:h-[1420px] min-[880px]:h-[1310px]";

type ApplyFormProps = {
  /** `getApplyForm().embedUrl`: the viewform link with `embedded=true`. */
  embedUrl: string;
  title: string;
};

/**
 * The cycle's Google Form, framed. A client component for two reasons:
 *
 * 1. The form runs over five sections. Each "Next" navigates the frame, and the browser
 *    leaves the parent page where it was — halfway down the section that just ended. Every
 *    load after the first scrolls the top of the frame back into view, instantly under
 *    reduced motion.
 * 2. That first navigation also swaps the frame from the first section's height to the
 *    shorter one the rest of the form needs, so a short section does not leave a white box
 *    under it.
 *
 * The frame deliberately does not track *which* section is showing, because it cannot: the
 * form is cross-origin, so its URL, document and history are all unreadable, it posts no
 * message with its height, and an iframe-only history traversal fires no `popstate` on this
 * page (all three checked, 2026-09-10). Going backwards — the form's own "Back" button or
 * the browser's — is therefore invisible here, and counting sections forward would leave the
 * frame permanently wrong for someone who went back once. Two heights instead of five keeps
 * it right in every case but one: an applicant who goes back to the *first* section, which
 * is much taller than the others, sees that one section scroll inside the frame until they
 * move forward again, when the frame fits once more.
 */
export function ApplyForm({ embedUrl, title }: ApplyFormProps) {
  const frame = useRef<HTMLDivElement>(null);
  const loads = useRef(0);
  const [started, setStarted] = useState(false);
  const reducedMotion = useReducedMotionSafe();

  return (
    <div
      ref={frame}
      className="corner-brackets scroll-mt-[calc(var(--header-h)+1.5rem)] border border-line bg-surface p-1.5 md:p-3"
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => {
          loads.current += 1;
          if (loads.current < 2) return;
          setStarted(true);
          frame.current?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        }}
        className={cn("block w-full bg-white", started ? LATER_SECTIONS : FIRST_SECTION)}
      />
    </div>
  );
}
