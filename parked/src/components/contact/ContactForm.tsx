"use client";

import Link from "next/link";
import { useState } from "react";
import { submitContactMessage } from "@/app/contact/actions";
import { Honeypot } from "@/components/forms/Honeypot";
import { SentPanel } from "@/components/forms/SentPanel";
import { useFormSubmission, type FormMode } from "@/components/forms/useFormSubmission";
import { ChoiceField, TextAreaField, TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  AUDIENCES,
  CONTACT_FIELDS,
  EMAIL_MAX,
  MESSAGE_MAX,
  MESSAGE_MIN,
  NAME_MAX,
  buildMailto,
  contactMessageSchema,
} from "@/lib/contact/schema";

type ContactFormProps = {
  /** See useFormSubmission: server delivery, or a mailto: fallback addressed to `email`. */
  mode: FormMode;
  email?: string | null;
};

const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";

/** Contact form. "Send another message" remounts the inner form to clear it. */
export function ContactForm(props: ContactFormProps) {
  const [formKey, setFormKey] = useState(0);
  return <ContactFormInner key={formKey} {...props} onReset={() => setFormKey((k) => k + 1)} />;
}

function ContactFormInner({ mode, email, onReset }: ContactFormProps & { onReset: () => void }) {
  const { formRef, formProps, pending, values, fieldErrors, summary, sent } = useFormSubmission({
    mode,
    email,
    action: submitContactMessage,
    fields: CONTACT_FIELDS,
    schema: contactMessageSchema,
    buildMailto,
    nameOf: (data) => data.name,
  });

  if (sent && !sent.opened) {
    return (
      <SentPanel title={`Thanks, ${sent.name}.`} onReset={onReset}>
        Your message is on its way. We read everything and reply by email.
      </SentPanel>
    );
  }
  if (sent?.opened) {
    return (
      <SentPanel title={`Thanks, ${sent.name}.`} onReset={onReset} eyebrow="Almost there">
        Your email app should have opened with the message filled in. Hit send there. If nothing
        opened, email us at{" "}
        <a href={`mailto:${email}`} className={inlineLink}>
          {email}
        </a>
        .
      </SentPanel>
    );
  }

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

      <Honeypot id="contact-fax" />

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
        <Link href="/privacy" className={inlineLink}>
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
