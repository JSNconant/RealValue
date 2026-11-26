"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, fullWidth, type, className = "", required, ...props },
  ref,
) {
  const autoId = useId();
  const id = props["aria-label"] ? undefined : autoId;
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div
      className={["field", fullWidth && "field--full", className]
        .filter(Boolean)
        .join(" ")}
    >
      {label && (
        <label
          htmlFor={id}
          className={["field__label", required && "field__label--req"]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </label>
      )}

      <div className={isPassword ? "field__input-wrap" : undefined}>
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          required={required}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-err` : hint ? `${id}-hint` : undefined
          }
          className={[
            "field__input",
            error && "field__input--error",
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="field__input-action"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span id={`${id}-err`} className="field__error" role="alert">
          <AlertCircle size={14} aria-hidden />
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${id}-hint`} className="field__hint">
          {hint}
        </span>
      )}
    </div>
  );
});
