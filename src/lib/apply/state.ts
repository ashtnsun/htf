import type { AnswerValue, ApplyStep, Problem } from "./schema";

/**
 * State returned by the application form's server actions (src/app/apply/form/actions.ts)
 * and rendered by <ApplicationForm>. Kept apart from the actions file because a "use server"
 * module may only export async functions.
 */
export type ApplyFormState =
  | { status: "idle" }
  | {
      status: "error";
      /** When the action ran (ms), so the form knows whether this or an autosave is newer. */
      at: number;
      step: ApplyStep;
      message: string;
      fieldErrors?: Record<string, string>;
      /** Echoed back so the form keeps what was typed (React resets forms after an action). */
      values?: Record<string, AnswerValue>;
      /** Review step: what still needs doing before the application can be submitted. */
      problems?: Problem[];
    };

export const APPLY_FORM_IDLE: ApplyFormState = { status: "idle" };

/**
 * Result of an autosave (a direct call, not a form submission). A save can succeed while
 * reporting fields it had to skip (an unfinished link, say), so "saved" may carry errors.
 */
export type AutosaveResult =
  | { status: "saved"; at: string; fieldErrors?: Record<string, string> }
  | { status: "error"; message: string };
