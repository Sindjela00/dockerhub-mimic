import type { ReactNode } from "react";

interface InputFieldProps {
  label?: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  onChangeRaw?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  id?: string;
  prefix?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
}

export default function InputField({
  label = "",
  type = "text",
  value,
  onChange,
  onChangeRaw,
  placeholder,
  error,
  id,
  prefix,
  startIcon,
  endIcon,
  className,
}: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  const borderClass = error
    ? "border-danger focus-within:border-danger"
    : "border-border focus-within:border-brand";

  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      <label
        htmlFor={inputId}
        className={`text-xs font-medium text-text-primary ${label ? "" : "hidden"}`}
      >
        {label}
      </label>

      <div
        className={[
          "flex items-center rounded-md bg-bg-elevated border overflow-hidden",
          "transition-colors",
          borderClass,
        ].join(" ")}
      >
        {prefix && (
          <span
            className="px-3 py-2 text-sm text-text-muted
                       border-r border-border bg-bg-overlay
                       select-none whitespace-nowrap shrink-0"
          >
            {prefix}
          </span>
        )}
        {startIcon && (
          <span className="pl-3 flex items-center text-text-muted shrink-0">
            {startIcon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            onChangeRaw?.(e);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent
                     text-text-primary placeholder:text-text-muted
                     focus:outline-none"
        />
        {endIcon && (
          <span className="pr-3 flex items-center text-text-muted shrink-0">
            {endIcon}
          </span>
        )}
      </div>

      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
