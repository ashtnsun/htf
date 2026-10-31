import { FAMILIES } from "@content/olympus";
import { Temple } from "@/components/olympus/Temple";

/** /olympus: pick your group, one temple column each. The numbers say nothing of the gods. */
export default function OlympusPage() {
  return (
    <>
      <h1 className="text-center font-olympus text-[2.5rem] leading-tight font-semibold sm:text-h2">
        Who is your <span className="text-green">god</span>?
      </h1>
      <p className="mt-4 text-center text-body-lg text-muted">Choose your group to begin.</p>
      <div className="mt-12 flex flex-col">
        <Temple count={FAMILIES.length} />
      </div>
    </>
  );
}
