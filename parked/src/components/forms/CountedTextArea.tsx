"use client";

import { useState, type ChangeEvent, type ComponentProps } from "react";
import { TextAreaField } from "@/components/ui/Field";

type CountedTextAreaProps = ComponentProps<typeof TextAreaField> & { maxLength: number };

/**
 * TextAreaField with a live "1,234 / 1,500" counter. The counter is decoration for sighted
 * users (the hint already states the limit and maxLength stops the overflow), so it is
 * hidden from assistive tech rather than announced on every keystroke.
 */
export function CountedTextArea({
  maxLength,
  defaultValue,
  onChange,
  ...props
}: CountedTextAreaProps) {
  const [count, setCount] = useState(() => String(defaultValue ?? "").length);
  return (
    <div>
      <TextAreaField
        {...props}
        maxLength={maxLength}
        defaultValue={defaultValue}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          setCount(event.currentTarget.value.length);
          onChange?.(event);
        }}
      />
      <p aria-hidden="true" className="mt-1.5 text-right text-xs text-muted tabular-nums">
        {count.toLocaleString("en-US")} / {maxLength.toLocaleString("en-US")}
      </p>
    </div>
  );
}
