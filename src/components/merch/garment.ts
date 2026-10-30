/**
 * The oversized zip-up, drawn as a ghost-mannequin product shot in a 1000 × 1150 frame:
 * dropped shoulders, wide sleeves that blouse over ribbed cuffs, a boxy body that blouses
 * over the hem rib, a hood lying on the back. Only the viewer's left side is written out;
 * the right is the same path mirrored about x = 500 (`MIRROR`).
 */

export const VIEW_W = 1000;
export const VIEW_H = 1150;
export const CENTRE_X = 500;
export const MIRROR = `translate(${VIEW_W} 0) scale(-1 1)`;

/** The close-up frame: the left shoulder, where the sleeve piece meets the back piece. */
export const CLOSE_UP = "100 230 480 552";

export const BODY_BACK =
  "M380 176C330 196 232 232 168 285C200 360 245 460 272 505C262 700 252 930 268 1000L732 1000C748 930 738 700 728 505C755 460 800 360 832 285C768 232 670 196 620 176Q500 194 380 176Z";
export const BODY_FRONT =
  "M380 176C330 196 232 232 168 285C200 360 245 460 272 505C262 700 252 930 268 1000L732 1000C748 930 738 700 728 505C755 460 800 360 832 285C768 232 670 196 620 176C604 222 562 252 507 260L493 260C438 252 396 222 380 176Z";
export const SLEEVE =
  "M168 285C130 420 105 640 92 820C88 846 96 862 108 870L200 870C214 860 222 842 220 820C232 700 256 580 272 505C245 460 200 360 168 285Z";
export const CUFF = "M106 866L202 866C204 900 201 940 197 970L113 970C109 940 105 900 106 866Z";
export const HEM =
  "M266 996L734 996C738 1026 731 1058 725 1080L275 1080C269 1058 262 1026 266 996Z";

/** The hood lying on the back, and its centre seam. */
export const HOOD_BACK =
  "M372 176C330 172 300 200 298 252C292 342 332 452 410 500C450 524 550 524 590 500C668 452 708 342 702 252C700 200 670 172 628 176C590 150 410 150 372 176Z";
export const HOOD_SEAM = "M500 160C501 300 499 420 500 518";
/** From the front: the inside of the hood standing behind the neck, and its left edge band. */
export const HOOD_WALL =
  "M350 204C344 144 418 104 500 102C582 104 656 144 650 204C640 234 560 270 500 272C440 270 360 234 350 204Z";
export const HOOD_BAND = "M350 190C362 232 420 266 497 276L497 258C432 250 394 222 386 180Z";

/** The armhole seam of the dropped shoulder (the sleeve's top edge). */
export const ARMHOLE = "M168 285C200 360 245 460 272 505";

/** The sleeve's own frame: where its centre line meets the armhole seam, its angle, size. */
export const SLEEVE_FRAME = { x: 220, y: 395, angle: 7.94, length: 476, width: 128 } as const;

/** Where the back piece starts (the sleeve's frame origin) and how low the garland dips. */
export const GARLAND = { anchor: [220, 395] as const, low: 598, spine: 250 } as const;

/** Folds, left side, as centre lines for blurred strokes: shadow first, then light. */
export const SLEEVE_FOLDS = {
  dark: [
    "M262 522C250 582 238 640 228 702",
    "M114 784C140 802 172 806 206 796",
    "M102 832C130 848 170 852 214 840",
    "M190 430C176 530 156 650 146 770",
  ],
  light: [
    "M116 806C140 820 172 824 208 814",
    "M152 340C136 460 122 600 112 760",
    "M200 420C184 540 170 670 160 800",
  ],
};
export const BODY_FOLDS = {
  dark: [
    "M288 540C330 620 356 720 368 850",
    "M296 900C340 942 400 960 470 966",
    "M270 958C360 990 640 990 730 958",
  ],
  light: ["M326 566C356 656 378 756 388 870", "M282 976C380 986 620 986 718 976"],
};

/** The front's kangaroo pocket, left half: its opening and the stitch line along its top. */
export const POCKET_OPENING = "M386 690C356 760 322 860 304 988";
export const POCKET_TOP = "M488 690L386 690";

/** Where the drawcords leave the hood band, and how they hang. */
export const CORD = "M464 262C460 330 454 400 457 474";
export const CORD_TIP = "M457 474L458 500";

/** Placements of the HTF marks. */
export const CHEST_DINO = { x: 604, y: 360, cell: 1.5 } as const;
export const CUFF_TAG = { x: 138, y: 926, w: 36, h: 14 } as const;
export const HEM_TAB = { x: 250, y: 1022, w: 24, h: 30 } as const;
