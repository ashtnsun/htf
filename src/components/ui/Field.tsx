import { CircleAlert } from "lucide-react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives for the contact form (and the Phase 2 portal). Labels are always visible,
 * hints and errors are wired through aria-describedby, and an invalid control gets
 * aria-invalid plus a cyan border: the palette has no red, so errors use the brand's
 * complementary colour with an icon so they never rely on colour alone.
 */

const controlClass = cn(
  "w-full rounded-sm border border-line-strong bg-surface px-4 text-base text-text",
  "transition-colors duration-200 placeholder:text-muted/70 hover:border-mint/40",
  "focus-visible:border-mint focus-visible:outline-offset-0",
  "disabled:opacity-60 aria-[invalid=true]:border-cyan",
);

type FieldChromeProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

function describedBy({ id, hint, error }: Pick<FieldChromeProps, "id" | "hint" | "error">) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldLabel({ id, label, required }: Pick<FieldChromeProps, "id" | "label" | "required">) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-text">
      {label}
      {required ? null : <span className="font-normal text-muted"> (optional)</span>}
    </label>
  );
}

function FieldHint({ id, hint }: Pick<FieldChromeProps, "id" | "hint">) {
  if (!hint) return null;
  return (
    <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
      {hint}
    </p>
  );
}

export function FieldError({ id, error }: Pick<FieldChromeProps, "id" | "error">) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm text-cyan">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{error}</span>
    </p>
  );
}

type TextFieldProps = FieldChromeProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "required"> & {
    className?: string;
  };

/** Single-line text input with label, hint and error. */
export function TextField({
  id,
  label,
  hint,
  error,
  required = true,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className={className}>
      <FieldLabel id={id} label={label} required={required} />
      <FieldHint id={id} hint={hint} />
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cn(controlClass, "mt-2 h-12")}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

type TextAreaFieldProps = FieldChromeProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className" | "required"> & {
    className?: string;
  };

/** Multi-line text input with label, hint and error. */
export function TextAreaField({
  id,
  label,
  hint,
  error,
  required = true,
  className,
  rows = 6,
  ...props
}: TextAreaFieldProps) {
  return (
    <div className={className}>
      <FieldLabel id={id} label={label} required={required} />
      <FieldHint id={id} hint={hint} />
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cn(controlClass, "mt-2 min-h-32 resize-y py-3 leading-relaxed")}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

type ChoiceOption = { value: string; label: string };

type ChoiceFieldProps = {
  id: string;
  name: string;
  legend: string;
  options: readonly ChoiceOption[];
  defaultValue?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

/**
 * Radio group rendered as 44px chips (the year-filter look). The inputs stay in the DOM
 * (sr-only) so arrow keys, form submission and required validation all behave natively.
 */
export function ChoiceField({
  id,
  name,
  legend,
  options,
  defaultValue,
  hint,
  error,
  required = true,
  className,
}: ChoiceFieldProps) {
  return (
    <fieldset
      className={className}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy({ id, hint, error })}
    >
      <legend className="block text-sm font-medium text-text">
        {legend}
        {required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </legend>
      <FieldHint id={id} hint={hint} />
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              required={required}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-4 text-sm font-medium transition-colors duration-200",
                "border-line-strong text-muted hover:border-mint/60 hover:text-text",
                "peer-checked:border-green peer-checked:bg-green peer-checked:text-bg",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-mint",
                error && "border-cyan",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}
