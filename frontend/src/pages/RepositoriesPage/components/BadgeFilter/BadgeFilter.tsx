import { Award, ShieldCheck, Sparkles } from "lucide-react";

import type { AccentClass } from "@/utils/accentStyle";
import { getAccent } from "@/utils/accentStyle";

export type BadgeOption = "official" | "verified" | "sponsored";

interface BadgeFilterProps {
  active: BadgeOption[];
  onChange: (next: BadgeOption[]) => void;
}

const OPTIONS: {
  value: BadgeOption;
  label: string;
  icon: React.ReactNode;
  accent: AccentClass;
}[] = [
  { value: "official", label: "Official", icon: <Award size={12} />, accent: "brand" },
  {
    value: "verified",
    label: "Verified Publisher",
    icon: <ShieldCheck size={12} />,
    accent: "info",
  },
  {
    value: "sponsored",
    label: "Sponsored OSS",
    icon: <Sparkles size={12} />,
    accent: "success",
  },
];

export default function BadgeFilter({ active, onChange }: BadgeFilterProps) {
  const toggle = (value: BadgeOption) => {
    onChange(
      active.includes(value)
        ? active.filter((v) => v !== value)
        : [...active, value],
    );
  };

  return (
    <div className="flex h-10 items-stretch gap-1 p-1 rounded-lg bg-bg-elevated border border-border">
      {OPTIONS.map((option) => {
        const isActive = active.includes(option.value);
        const accent = getAccent(option.accent);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={isActive}
            className={[
              "flex items-center gap-1.5 px-3 rounded-md text-sm font-medium",
              "transition-colors duration-100 cursor-pointer",
              isActive
                ? `${accent.bg} ${accent.text}`
                : "text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
