import { HONEYPOT_FIELD } from "@/lib/forms/fields";

/** Off-screen field skipped by tab order and assistive tech; bots fill it, humans never see it. */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden="true" className="absolute top-auto -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input id={id} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
