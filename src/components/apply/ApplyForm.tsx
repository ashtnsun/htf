"use client";

import { useRef, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";

type ApplyFormProps = {
  /** `getApplyForm().embedUrl`: the viewform link with `embedded=true`. */
  embedUrl: string;
  title: string;
};

/**
 * How tall the frame is for each section of the form, per width. Nothing scrolls inside the
 * frame: a nested scrollbar was what Ashton asked to lose (2026-09-10), and a frame the page
 * scrolls through cannot trap the wheel either. The numbers are measured — run
 * `node scripts/measure-apply-form.mjs` against a production build after the form changes and
 * paste the new ones in. The narrower the column, the more each question wraps, so every
 * section runs taller; and the form gets shorter as it goes (8 questions, then 6, 4, 3, 3).
 */
const SECTION_HEIGHTS = [
  "h-[2870px] min-[360px]:h-[2570px] min-[420px]:h-[2450px] min-[480px]:h-[2320px] min-[520px]:h-[2250px] min-[640px]:h-[2110px] min-[768px]:h-[2030px] min-[880px]:h-[1970px]",
  "h-[2450px] min-[360px]:h-[2170px] min-[420px]:h-[1920px] min-[480px]:h-[1730px] min-[520px]:h-[1640px] min-[640px]:h-[1530px] min-[768px]:h-[1420px] min-[880px]:h-[1310px]",
  "h-[2130px] min-[360px]:h-[1930px] min-[420px]:h-[1720px] min-[480px]:h-[1570px] min-[520px]:h-[1570px] min-[640px]:h-[1500px] min-[768px]:h-[1330px] min-[880px]:h-[1270px]",
  "h-[1420px] min-[360px]:h-[1290px] min-[420px]:h-[1150px] min-[480px]:h-[1090px] min-[520px]:h-[1070px] min-[640px]:h-[1000px] min-[768px]:h-[910px] min-[880px]:h-[850px]",
  "h-[1190px] min-[360px]:h-[1040px] min-[420px]:h-[990px] min-[480px]:h-[860px] min-[520px]:h-[860px] min-[640px]:h-[840px] min-[768px]:h-[800px] min-[880px]:h-[740px]",
];

/**
 * The cycle's Google Form, framed. A client component for two reasons:
 *
 * 1. The form runs over five sections. Each "Next" navigates the frame, and the browser
 *    leaves the parent page where it was — halfway down the section that just ended. Every
 *    load after the first scrolls the top of the frame back into view, instantly under
 *    reduced motion.
 * 2. That same count picks the frame's height from `SECTION_HEIGHTS`, so a short section does
 *    not leave a white box under it. The count only ever goes forward: someone who uses the
 *    form's own "Back" button lands on a taller section than the frame expects, and that one
 *    section scrolls inside until they move on. Nothing in the frame can be read from here to
 *    do better — it is Google's page, cross-origin.
 */
export function ApplyForm({ embedUrl, title }: ApplyFormProps) {
  const frame = useRef<HTMLDivElement>(null);
  const loads = useRef(0);
  const [section, setSection] = useState(0);
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
          setSection((current) => Math.min(current + 1, SECTION_HEIGHTS.length - 1));
          frame.current?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        }}
        className={cn("block w-full bg-white", SECTION_HEIGHTS[section])}
      />
    </div>
  );
}
