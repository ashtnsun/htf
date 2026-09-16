/**
 * Where members have interned or worked, from the club's "Where do we land?" graphics
 * (2026-09-15). Logos in public/images/landed are the companies' own marks (Wikimedia Commons;
 * Atlassian, Boeing, Delta, Accenture, Y Combinator and Tesla from Simple Icons), symbol only
 * where a company has one. `fill` is the bubble, in the company's colour as in the graphics;
 * `mono` draws the logo in white through a mask, otherwise the file's own colours show.
 * Seven logos in the graphics are not yet identified and are left out (PROGRESS.md).
 */
export type LandedCompany = {
  name: string;
  logo: string;
  fill: string;
  /** white through a mask instead of the file's own colours */
  mono?: boolean;
  /** a wordmark: laid out wide in the bubble, where a symbol is square */
  wide?: boolean;
  /** multiplies the logo's size in the bubble, for a mark that reads small or large at 1 */
  scale?: number;
};

const l = (
  name: string,
  /** file name in public/images/landed, with its extension */
  file: string,
  fill: string,
  mono = false,
  wide = false,
  scale = 1,
): LandedCompany => ({ name, logo: `/images/landed/${file}`, fill, mono, wide, scale });

export const landed: LandedCompany[] = [
  l("Google", "google.svg", "#1F1F1F"),
  l("Microsoft", "microsoft.svg", "#2A2A2A"),
  l("Meta", "meta.svg", "#0866FF", true),
  l("Amazon", "amazon.svg", "#232F3E", true, true),
  l("Netflix", "netflix.svg", "#000000", false, true),
  l("Tesla", "tesla.svg", "#CC0000", false, false, 0.92),
  l("SpaceX", "spacex.svg", "#000000", true, true),
  l("IBM", "ibm.svg", "#0F62FE", true, true, 0.92),
  l("Oracle", "oracle.svg", "#C74634", true, true),
  l("Salesforce", "salesforce.svg", "#00A1E0", false, true, 1.6),
  l("Adobe", "adobe.svg", "#FA0F00", true),
  l("Samsung", "samsung.svg", "#1428A0", false, true),
  l("Atlassian", "atlassian.svg", "#0052CC", false, false, 0.9),
  l("LinkedIn", "linkedin.svg", "#007EBB"),
  l("Bloomberg", "bloomberg.svg", "#2800D7", true, true),
  l("J.P. Morgan", "jpmorgan.svg", "#3E2A1E", true, true),
  l("Capital One", "capitalone.svg", "#004977", true, true),
  l("Y Combinator", "ycombinator.svg", "#F26625"),
  l("Accenture", "accenture.svg", "#A100FF", false, false, 0.88),
  l("Deloitte", "deloitte.svg", "#000000", true, true),
  l("PwC", "pwc.svg", "#D04A02", true, true, 0.85),
  l("Boeing", "boeing.svg", "#0033A1"),
  l("GE", "ge.svg", "#3B73B9", false, false, 1.2),
  l("Ford", "ford.svg", "#00095B", false, true),
  l("Delta", "delta.svg", "#0B1F3F", false, false, 1.12),
  l("Panasonic", "panasonic.svg", "#0041C0", true, true),
  l("Nokia", "nokia.svg", "#124191", true, true),
  l("Gemini", "gemini.svg", "#00BFE8", true),
  l("Liberty Mutual", "libertymutual.png", "#FFD400", false, false, 1.4),
  l("Sysco", "sysco.svg", "#008CD2", true, true),
  l("EY", "ey.png", "#2E2E38", false, false, 1.5),
  l("Palantir", "palantir.svg", "#101113", true, true),
  l("John Deere", "johndeere.svg", "#367C2B"),
  l("Deutsche Bank", "deutschebank.svg", "#0018A8", true, false, 0.9),
];
