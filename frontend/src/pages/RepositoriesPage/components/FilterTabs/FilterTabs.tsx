import { Star } from "lucide-react";
import { VisibilityFilter } from "../../types/types";

interface FilterTabsProps {
  active: VisibilityFilter;
  onChange: (f: VisibilityFilter) => void;
  counts: number;
  starredOnly: boolean;
  onStarredChange: (v: boolean) => void;
}

const TABS: { label: string; value: VisibilityFilter }[] = [
  { label: "All", value: "all" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

export default function FilterTabs({
  active,
  onChange,
  counts,
  starredOnly,
  onStarredChange,
}: FilterTabsProps) {
  return (
    <div className="flex h-10 items-stretch gap-1 p-1 rounded-lg bg-bg-elevated border border-border">
      {TABS.map((tab) => {
        const isActive = active === tab.value && !starredOnly;

        return (
          <button
            key={tab.value}
            onClick={() => {
              if (starredOnly) onStarredChange(false);
              onChange(tab.value);
            }}
            className={[
              "flex items-center gap-1.5 px-3 rounded-md text-sm font-medium",
              "transition-colors duration-100 cursor-pointer",
              isActive
                ? "bg-bg-surface text-text-primary border border-border"
                : "text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {tab.label}
            {isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-muted text-brand">
                {counts}
              </span>
            )}
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-px bg-border mx-1 self-stretch" />

      {/* Starred */}
      <button
        onClick={() => onStarredChange(!starredOnly)}
        className={[
          "flex items-center gap-1.5 px-3 rounded-md text-sm font-medium",
          "transition-colors duration-100 cursor-pointer",
          starredOnly
            ? "bg-bg-surface text-brand border border-border"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        <Star
          size={13}
          className={starredOnly ? "fill-brand text-brand" : ""}
        />
        Starred
        {starredOnly && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-brand">
            {counts}
          </span>
        )}
      </button>
    </div>
  );
}
