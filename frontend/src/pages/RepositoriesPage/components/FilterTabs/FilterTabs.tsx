import { VisibilityFilter } from "../../types/types";

interface FilterTabsProps {
  active: VisibilityFilter;
  onChange: (f: VisibilityFilter) => void;
  counts: Record<VisibilityFilter, number>;
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
}: FilterTabsProps) {
  return (
    <div
      className="flex h-10 items-stretch gap-1 p-1 rounded-lg bg-bg-elevated
                    border border-border"
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            "flex items-center gap-1.5 px-3 rounded-md text-sm font-medium",
            "transition-colors duration-100 cursor-pointer",
            active === tab.value
              ? "bg-bg-surface text-text-primary border border-border"
              : "text-text-secondary hover:text-text-primary",
          ].join(" ")}
        >
          {tab.label}
          <span
            className={[
              "text-[10px] px-1.5 py-0.5 rounded-full",
              active === tab.value
                ? "bg-brand-muted text-brand"
                : "bg-bg-surface text-text-secondary",
            ].join(" ")}
          >
            {counts[tab.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
