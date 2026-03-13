interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-primary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full px-3 py-2 text-sm rounded-md",
          "bg-bg-elevated border",
          "text-text-primary placeholder:text-text-muted",
          "focus:outline-none transition-colors",
          error
            ? "border-danger focus:border-danger"
            : "border-border focus:border-brand",
        ].join(" ")}
      />
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
