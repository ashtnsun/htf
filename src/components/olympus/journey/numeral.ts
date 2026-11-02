const STEPS: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Any whole number from 1 in Roman numerals (the journey counts past X: rods, faces). */
export function roman(n: number) {
  let rest = Math.floor(n);
  if (rest < 1) return String(n);
  let out = "";
  for (const [value, mark] of STEPS) {
    while (rest >= value) {
      out += mark;
      rest -= value;
    }
  }
  return out;
}
