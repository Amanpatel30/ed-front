"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FieldOption {
  value: string;
  label: string;
}

function FieldMessages({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  return (
    <>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </>
  );
}

/** Ids of whichever descriptions are actually rendered, for aria-describedby. */
function describedBy(id: string, error?: string, hint?: string) {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(
    Boolean
  );

  return ids.length > 0 ? ids.join(" ") : undefined;
}

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {label}
      {required ? (
        <span aria-hidden className="text-destructive">
          *
        </span>
      ) : null}
    </Label>
  );
}

export function TextField({
  id,
  label,
  value,
  onValueChange,
  type = "text",
  error,
  hint,
  required,
  disabled,
  placeholder,
  autoComplete,
  inputMode,
  min,
  max,
  step,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        autoFocus={autoFocus}
      />
      <FieldMessages id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error,
  hint,
  required,
  disabled,
}: {
  id: string;
  label: string;
  /** `null` shows the placeholder rather than an empty selection. */
  value: string | null;
  onValueChange: (value: string) => void;
  options: FieldOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  // Passing `items` lets the trigger render the option's label instead of its id.
  const items = React.useMemo(
    () => Object.fromEntries(options.map((option) => [option.value, option.label])),
    [options]
  );

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <Select
        items={items}
        value={value}
        disabled={disabled}
        onValueChange={(next) => onValueChange(typeof next === "string" ? next : "")}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldMessages id={id} error={error} hint={hint} />
    </div>
  );
}
