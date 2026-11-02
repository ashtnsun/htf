import { PrologueLoader } from "@/components/olympus/prologue/PrologueLoader";
import { getExec, getExecYears } from "@/lib/content";

/**
 * /prologue: the slides the exec at the projectors clicks through to open the family reveal. Only
 * the board's first names and photos reach the page, in the board's own order.
 */
export default function ProloguePage() {
  const year = getExecYears()[0];
  const execs = getExec()
    .filter((member) => member.year === year)
    .flatMap(({ name, photo }) => (photo ? [{ name: name.split(" ")[0]!, photo }] : []));
  return <PrologueLoader execs={execs} />;
}
