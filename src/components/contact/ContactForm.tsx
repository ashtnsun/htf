"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitContactMessage, type ContactFormState } from "@/app/contact/actions";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChoiceField, TextAreaField, TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  AUDIENCES,
  EMAIL_MAX,
  MESSAGE_MAX,
  MESSAGE_MIN,
  NAME_MAX,
  buildMailto,
  contactMessageSchema,
  firstFieldErrors,
  readContactValues,
  type ContactField,
  type ContactValues,
} from "@/lib/contact/schema";

type ContactFormProps = {
  /**
   * server = the server action stores / emails the message (Supabase, Resend).
   * mailto = no delivery configured yet: submitting opens the visitor's email app with the
   * message filled in, addressed to `email`.
   */
  mode: "server" | "mailto";
  email?: string | null;
};

type MailtoState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<ContactField, string>> }
  | { status: "opened"; name: string };

const INITIAL: ContactFormState = { status: "idle" };
const EMPTY_VALUES: ContactValues = { name: "", email: "", audience: "", message: "" };

/**
 * Contact form. Progressive enhancement: without JavaScript the form still posts to the
 * server action and the page re-renders with errors or the sent state. With JavaScript,
 * useActionState gives inline errors and a pending state without a navigation.
 * "Send another message" remounts the inner form to clear it.
 */
export function ContactForm(props: ContactFormProps) {
  const [formKey, setFormKey] = useState(0);
  return <ContactFormInner key={formKey} {...props} onReset={() => setFormKey((k) => k + 1)} />;
}

function ContactFormInner({ mode, email, onReset }: ContactFormProps & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(submitContactMessage, INITIAL);
  const [mailto, setMailto] = useState<MailtoState>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  const values = state.status === "error" && state.values ? state.values : EMPTY_VALUES;
  const fieldErrors =
    mode === "mailto"
      ? mailto.status === "error"
        ? mailto.fieldErrors
        : {}
      : state.status === "error"
        ? (state.fieldErrors ?? {})
        : {};
  const summary =
    mode === "mailto"
      ? mailto.status === "error"
        ? mailto.message
        : null
      : state.status === "error"
        ? state.message
        : null;

  // After a failed submit, put the keyboard on the first invalid control.
  useEffect(() => {
    if (!summary) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid?.tagName === "FIELDSET") {
      invalid.querySelector<HTMLElement>("input")?.focus();
    } else {
      invalid?.focus();
    }
  }, [summary, state, mailto]);

  if (mode === "server" && state.status === "sent") {
    return (
      <SentPanel title={`Thanks, ${state.name}.`} onReset={onReset}>
        Your message is on its way. We read everything and reply by email.
      </SentPanel>
    );
  }
  if (mode === "mailto" && mailto.status === "opened") {
    return (
      <SentPanel title={`Thanks, ${mailto.name}.`} onReset={onReset} eyebrow="Almost there">
        Your email app should have opened with the message filled in. Hit send there. If nothing
        opened, email us at{" "}
        <a
          href={`mailto:${email}`}
          className="text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green"
        >
          {email}
        </a>
        .
      </SentPanel>
    );
  }

  function handleMailtoSubmit(event: FormEvent<HTMLFormElement>) {
    if (!email) return;
    event.preventDefault();
    const parsed = contactMessageSchema.safeParse(
      readContactValues(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setMailto({
        status: "error",
        message: "Please check the highlighted fields.",
        fieldErrors: firstFieldErrors(parsed.error),
      });
      return;
    }
    window.location.href = buildMailto(email, parsed.data);
    setMailto({ status: "opened", name: parsed.data.name });
  }

  const formProps =
    mode === "server"
      ? { action: formAction }
      : { action: `mailto:${email ?? ""}`, method: "get" as const, onSubmit: handleMailtoSubmit };

  return (
    <form ref={formRef} {...formProps} className="space-y-6">
      {summary ? (
        <p role="alert" className="border border-cyan/50 bg-surface px-4 py-3 text-sm text-text">
          {summary}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="contact-name"
          name="name"
          label="Name"
          autoComplete="name"
          maxLength={NAME_MAX}
          defaultValue={values.name}
          error={fieldErrors.name}
        />
        <TextField
          id="contact-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX}
          defaultValue={values.email}
          error={fieldErrors.email}
        />
      </div>

      <ChoiceField
        id="contact-audience"
        name="audience"
        legend="I am"
        options={AUDIENCES}
        defaultValue={values.audience}
        error={fieldErrors.audience}
      />

      <TextAreaField
        id="contact-message"
        name="message"
        label="Message"
        hint={`A few sentences is plenty. Up to ${MESSAGE_MAX.toLocaleString("en-US")} characters.`}
        minLength={MESSAGE_MIN}
        maxLength={MESSAGE_MAX}
        defaultValue={values.message}
        error={fieldErrors.message}
      />

      {/* Honeypot: off-screen, skipped by tab order and assistive tech, filled by bots. */}
      <div
        aria-hidden="true"
        className="absolute top-auto -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-fax">Leave this field empty</label>
        <input id="contact-fax" name="fax" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <SplitButton type="submit" size="lg" pending={pending}>
          {pending ? "Sending" : "Send message"}
        </SplitButton>
        <p className="text-sm text-muted">
          {mode === "mailto"
            ? "Opens your email app with the message filled in."
            : "We reply by email, usually within a few days."}
        </p>
      </div>

      <p className="text-xs text-muted">
        How we handle what you send is in our{" "}
        <Link
          href="/privacy"
          className="text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green"
        >
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

type SentPanelProps = {
  title: string;
  children: ReactNode;
  onReset: () => void;
  eyebrow?: string;
};

function SentPanel({ title, children, onReset, eyebrow = "Message sent" }: SentPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="border border-line bg-surface p-6 outline-none sm:p-8"
    >
      <Eyebrow tone="green">{eyebrow}</Eyebrow>
      <p className="mt-4 font-display text-h3 font-medium text-text">{title}</p>
      <p className="mt-3 max-w-prose text-muted">{children}</p>
      <SplitButton variant="secondary" className="mt-8" onClick={onReset}>
        Send another message
      </SplitButton>
    </div>
  );
}
