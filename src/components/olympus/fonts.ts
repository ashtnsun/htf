import { Cinzel, Cormorant_Garamond } from "next/font/google";

/** Roman inscription capitals for the numerals, the headings and the gods' names. */
export const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
/** A classical book serif for the riddles, the Oracle's voice. */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
