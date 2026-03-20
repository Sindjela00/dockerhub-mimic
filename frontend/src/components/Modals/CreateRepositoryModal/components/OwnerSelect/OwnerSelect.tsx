import { ChevronDown } from "lucide-react";
import { Owner } from "../../types/types";
import { useState } from "react";

interface OwnerSelectProps {
  value: string;
  owners: Owner[];
  onChange: (v: string) => void;
}

export function OwnerSelect({ value, owners, onChange }: OwnerSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = owners.find((o) => o.value === value) ?? owners[0];

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-xs font-medium text-text-primary">Owner</label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 px-3 py-2
                   rounded-md bg-bg-elevated border border-border
                   text-sm text-text-primary
                   hover:border-border-strong transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full bg-brand-muted flex items-center
                          justify-center text-[10px] font-bold text-brand"
          >
            {selected.label.slice(0, 1).toUpperCase()}
          </div>
          <span>{selected.label}</span>
          <span
            className="text-[10px] text-text-muted px-1.5 py-0.5 rounded-full
                           bg-bg-surface border border-border"
          >
            {selected.type === "user" ? "Personal" : "Organization"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-150
                      ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-10
                        bg-bg-surface border border-border rounded-lg
                        overflow-hidden shadow-lg"
        >
          {owners.map((owner) => (
            <button
              key={owner.value}
              type="button"
              onClick={() => {
                onChange(owner.value);
                setOpen(false);
              }}
              className={[
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm",
                "hover:bg-bg-elevated transition-colors text-left",
                owner.value === value ? "text-brand" : "text-text-primary",
              ].join(" ")}
            >
              <div
                className="w-5 h-5 rounded-full bg-brand-muted flex items-center
                              justify-center text-[10px] font-bold text-brand"
              >
                {owner.label.slice(0, 1).toUpperCase()}
              </div>
              <span>{owner.label}</span>
              <span
                className="ml-auto text-[10px] text-text-muted px-1.5 py-0.5
                               rounded-full bg-bg-elevated border border-border"
              >
                {owner.type === "user" ? "Personal" : "Organization"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
