interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  id?: string;
  prefix?: string;
}

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  id,
  prefix,
}: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  const borderClass = error
    ? "border-danger focus-within:border-danger"
    : "border-border focus-within:border-brand";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-text-primary"
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
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent
                     text-text-primary placeholder:text-text-muted
                     focus:outline-none"
        />
      </div>

      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
