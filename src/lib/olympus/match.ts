import "server-only";

/** Lower case, letters and digits only, without leading words like "a", "the", "in", "mount". */
export function normalize(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/^((a|an|the|your|my|in|mount|mt)\s+)+/, "")
    .replace(/\s+/g, "");
}

/** A riddle's answer, forgiving case, spacing, punctuation, a leading article and a plural. */
export function matches(guess: string, answers: readonly string[]) {
  const g = normalize(guess);
  return answers.some((answer) => {
    const a = normalize(answer);
    return g === a || g === `${a}s` || g === `${a}es`;
  });
}
