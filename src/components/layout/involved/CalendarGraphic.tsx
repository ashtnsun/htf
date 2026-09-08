"use client";

import { delay, GraphicFrame, HAIRLINE, svgProps } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/** Column centres for the seven weekdays and the row centres for up to six weeks. */
const COLS = [104, 136, 168, 200, 232, 264, 296];
const ROW_Y = (row: number) => 172 + row * 24;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Plain calendar maths on the deadline's own year, month and day (already in the club's zone). */
function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const name = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(first);
  const rows: (number | null)[][] = [];
  for (let day = 1 - firstWeekday; day <= days; day += 7) {
    rows.push(
      Array.from({ length: 7 }, (_, i) => (day + i >= 1 && day + i <= days ? day + i : null)),
    );
  }
  return { name, rows };
}

/**
 * "Calendar": the deadline, as a date on a wall calendar. In season the page shows the
 * deadline's month with the day filled green and a ring drawing around it; out of season it
 * shows the academic year over an empty grid. The rows appear one after another when the
 * section scrolls into view. Complete under prefers-reduced-motion.
 */
export function CalendarGraphic({ season, academicYear, className }: InvolvedGraphicProps) {
  const grid = season ? monthGrid(season.deadline.year, season.deadline.month) : null;
  const title = grid && season ? `${grid.name} ${season.deadline.year}` : academicYear;
  return (
    <GraphicFrame className={className}>
      {({ reduce }) => (
        <svg {...svgProps}>
          {/* the page, its header and the rings */}
          <rect x="88" y="92" width="224" height="224" fill="var(--surface)" {...HAIRLINE} />
          <rect x="88" y="92" width="224" height="40" fill="var(--green)" />
          <rect x="130" y="82" width="10" height="20" fill="var(--bg)" {...HAIRLINE} />
          <rect x="260" y="82" width="10" height="20" fill="var(--bg)" {...HAIRLINE} />
          <text
            x="200"
            y="118"
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            letterSpacing="0.5"
            fill="var(--bg)"
          >
            {title}
          </text>
          <path d="M296 316L312 300V316Z" fill="var(--surface-2)" {...HAIRLINE} />

          {/* weekdays */}
          {WEEKDAYS.map((d, i) => (
            <text
              key={i}
              x={COLS[i]}
              y="152"
              textAnchor="middle"
              fontSize="9"
              fontWeight="500"
              fill="var(--muted)"
            >
              {d}
            </text>
          ))}

          {grid && season
            ? grid.rows.map((row, r) => (
                <g key={r} className="anim-involved-fade" style={delay(0.15 + r * 0.12, reduce)}>
                  {row.map((day, c) =>
                    day === null ? null : day === season.deadline.day ? (
                      <g key={c}>
                        <rect
                          x={COLS[c]! - 11}
                          y={ROW_Y(r) - 11}
                          width="22"
                          height="22"
                          fill="var(--green)"
                        />
                        <text
                          x={COLS[c]}
                          y={ROW_Y(r) + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="var(--bg)"
                        >
                          {day}
                        </text>
                        <circle
                          cx={COLS[c]}
                          cy={ROW_Y(r)}
                          r="16"
                          pathLength="1"
                          fill="none"
                          stroke="var(--green)"
                          strokeWidth="2"
                          className="anim-draw"
                          style={delay(1.2, reduce)}
                        />
                      </g>
                    ) : (
                      <text
                        key={c}
                        x={COLS[c]}
                        y={ROW_Y(r) + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--text)"
                      >
                        {day}
                      </text>
                    ),
                  )}
                </g>
              ))
            : Array.from({ length: 5 }, (_, r) => (
                <g key={r} className="anim-involved-fade" style={delay(0.15 + r * 0.12, reduce)}>
                  {COLS.map((x, c) => (
                    <rect
                      key={c}
                      x={x - 10}
                      y={ROW_Y(r) - 10}
                      width="20"
                      height="20"
                      fill="none"
                      {...HAIRLINE}
                    />
                  ))}
                </g>
              ))}
        </svg>
      )}
    </GraphicFrame>
  );
}
