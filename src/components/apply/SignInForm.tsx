"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { requestSignInCode, verifySignInCode } from "@/app/apply/actions";
import { Honeypot } from "@/components/forms/Honeypot";
import { TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import { CODE_LENGTH, EMAIL_MAX } from "@/lib/auth/schema";
import { SIGN_IN_IDLE } from "@/lib/auth/state";

type SignInFormProps = {
  /** Portal path to land on after signing in (already sanitised by the page). */
  next: string;
  /** Message from the page, e.g. an expired link. Shown above the email step. */
  notice?: string | null;
};

const inlineLink =
  "text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green";
const textButton =
  "min-h-11 text-sm text-muted underline decoration-green/70 underline-offset-4 transition-colors hover:text-green disabled:opacity-60";

/**
 * Two-step sign-in: email, then the six-digit code from the email (the link in the same
 * email signs in without this step). Both steps are server actions, so the form also works
 * without JavaScript: each submit re-renders with the returned state. "Use a different
 * email" remounts the steps to start over.
 */
export function SignInForm(props: SignInFormProps) {
  const [formKey, setFormKey] = useState(0);
  return <SignInSteps key={formKey} {...props} onRestart={() => setFormKey((k) => k + 1)} />;
}

function SignInSteps({ next, notice, onRestart }: SignInFormProps & { onRestart: () => void }) {
  const [sent, requestAction, requesting] = useActionState(requestSignInCode, SIGN_IN_IDLE);
  const [verify, verifyAction, verifying] = useActionState(verifySignInCode, SIGN_IN_IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  // The two actions keep separate states; the newer one is the one to show. A failed code (or
  // a failed resend) keeps the code step even when the request state has reset, which is what
  // happens for submissions without JavaScript.
  const active =
    verify.status !== "idle" && (sent.status === "idle" || verify.at >= sent.at) ? verify : sent;
  const codeStep =
    active.status === "sent" || (active.status === "error" && active.step === "code");
  const email = active.status === "idle" ? "" : active.email;
  const fieldErrors = active.status === "error" ? (active.fieldErrors ?? {}) : {};
  const summary =
    active.status === "error"
      ? active.message
      : active.status === "sent" && active.resent
        ? `We sent a new code to ${active.email}.`
        : codeStep
          ? null
          : notice;

  // Put the keyboard where the next action is: the code input when it appears, or the first
  // invalid control after a failed submit.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid) {
      invalid.focus();
    } else if (codeStep) {
      form.querySelector<HTMLInputElement>("#signin-code")?.focus();
    }
  }, [codeStep, active]);

  if (codeStep) {
    return (
      <form ref={formRef} action={verifyAction} className="space-y-6">
        {summary ? (
          <p role="alert" className="border border-cyan/50 bg-surface px-4 py-3 text-sm text-text">
            {summary}
          </p>
        ) : null}
        <p className="text-muted">
          We sent a code to <span className="break-all text-text">{email}</span>. Enter it here, or
          open the link in that email on this device.
        </p>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        {/* Read by requestSignInCode when "Send a new code" posts this form (a button with a
            function formAction cannot carry a name of its own); verifySignInCode ignores it. */}
        <input type="hidden" name="resend" value="1" />
        <TextField
          id="signin-code"
          name="code"
          label="Six-digit code"
          hint="Codes work once and expire after an hour."
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={CODE_LENGTH}
          spellCheck={false}
          error={fieldErrors.code}
          className="max-w-xs"
          style={{ letterSpacing: "0.3em" }}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <SplitButton type="submit" size="lg" pending={verifying}>
            {verifying ? "Signing in" : "Sign in"}
          </SplitButton>
          <button
            type="submit"
            formAction={requestAction}
            formNoValidate
            disabled={requesting}
            className={textButton}
          >
            {requesting ? "Sending a new code…" : "Send a new code"}
          </button>
        </div>
        <p className="text-sm text-muted">
          Wrong address?{" "}
          <a
            href="/apply"
            className={inlineLink}
            onClick={(event) => {
              event.preventDefault();
              onRestart();
            }}
          >
            Use a different email
          </a>
          .
        </p>
      </form>
    );
  }

  return (
    <form ref={formRef} action={requestAction} className="space-y-6">
      {summary ? (
        <p role="alert" className="border border-cyan/50 bg-surface px-4 py-3 text-sm text-text">
          {summary}
        </p>
      ) : null}
      <input type="hidden" name="next" value={next} />
      <TextField
        id="signin-email"
        name="email"
        type="email"
        label="Email"
        hint="Any address works. Use the one you check most; decisions go there too."
        autoComplete="email"
        inputMode="email"
        maxLength={EMAIL_MAX}
        defaultValue={active.status === "error" ? active.email : ""}
        error={fieldErrors.email}
      />
      <Honeypot id="signin-fax" />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <SplitButton type="submit" size="lg" pending={requesting}>
          {requesting ? "Sending" : "Email me a code"}
        </SplitButton>
        <p className="text-sm text-muted">No password. We email a six-digit code and a link.</p>
      </div>
      <p className="text-xs text-muted">
        Signing in creates an account for your application. How we handle it is in our{" "}
        <Link href="/privacy" className={inlineLink}>
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
