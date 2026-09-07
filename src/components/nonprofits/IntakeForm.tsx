"use client";

import Link from "next/link";
import { useState } from "react";
import { submitInquiry } from "@/app/nonprofits/actions";
import { Honeypot } from "@/components/forms/Honeypot";
import { SentPanel } from "@/components/forms/SentPanel";
import { useFormSubmission, type FormMode } from "@/components/forms/useFormSubmission";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  EMAIL_MAX,
  INQUIRY_FIELDS,
  LOCATION_MAX,
  MESSAGE_MAX,
  MESSAGE_MIN,
  NAME_MAX,
  ORGANIZATION_MAX,
  WEBSITE_MAX,
  buildInquiryMailto,
  inquirySchema,
} from "@/lib/inquiries/schema";

type IntakeFormProps = {
  /** See useFormSubmission: server delivery, or a mailto: fallback addressed to `email`. */
  mode: FormMode;
  email?: string | null;
};

const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";

/** Nonprofit intake ("Start a project"). "Send another" remounts the inner form to clear it. */
export function IntakeForm(props: IntakeFormProps) {
  const [formKey, setFormKey] = useState(0);
  return <IntakeFormInner key={formKey} {...props} onReset={() => setFormKey((k) => k + 1)} />;
}

function IntakeFormInner({ mode, email, onReset }: IntakeFormProps & { onReset: () => void }) {
  const { formRef, formProps, pending, values, fieldErrors, summary, sent } = useFormSubmission({
    mode,
    email,
    action: submitInquiry,
    fields: INQUIRY_FIELDS,
    schema: inquirySchema,
    buildMailto: buildInquiryMailto,
    nameOf: (data) => data.name,
  });

  if (sent && !sent.opened) {
    return (
      <SentPanel
        title={`Thanks, ${sent.name}.`}
        eyebrow="Inquiry sent"
        resetLabel="Send another inquiry"
        onReset={onReset}
      >
        We have your inquiry and will reply by email. If the project looks like a fit, the next step
        is a scoping call.
      </SentPanel>
    );
  }
  if (sent?.opened) {
    return (
      <SentPanel
        title={`Thanks, ${sent.name}.`}
        eyebrow="Almost there"
        resetLabel="Send another inquiry"
        onReset={onReset}
      >
        Your email app should have opened with the inquiry filled in. Hit send there. If nothing
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

      <TextField
        id="intake-organization"
        name="organization"
        label="Organization"
        autoComplete="organization"
        maxLength={ORGANIZATION_MAX}
        defaultValue={values.organization}
        error={fieldErrors.organization}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="intake-name"
          name="name"
          label="Your name"
          autoComplete="name"
          maxLength={NAME_MAX}
          defaultValue={values.name}
          error={fieldErrors.name}
        />
        <TextField
          id="intake-email"
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

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="intake-website"
          name="website"
          label="Website"
          required={false}
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="example.org"
          maxLength={WEBSITE_MAX}
          defaultValue={values.website}
          error={fieldErrors.website}
        />
        <TextField
          id="intake-location"
          name="location"
          label="Where you are based"
          required={false}
          hint="City and state, or country."
          maxLength={LOCATION_MAX}
          defaultValue={values.location}
          error={fieldErrors.location}
        />
      </div>

      <TextAreaField
        id="intake-message"
        name="message"
        label="What are you trying to solve?"
        hint="The problem, who deals with it today, and what a win would look like. A rough idea is enough; we scope the details together."
        minLength={MESSAGE_MIN}
        maxLength={MESSAGE_MAX}
        rows={7}
        defaultValue={values.message}
        error={fieldErrors.message}
      />

      <Honeypot id="intake-fax" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <SplitButton type="submit" size="lg" pending={pending}>
          {pending ? "Sending" : "Send inquiry"}
        </SplitButton>
        <p className="text-sm text-muted">
          {mode === "mailto"
            ? "Opens your email app with the inquiry filled in."
            : "We reply by email. No commitment on either side yet."}
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
