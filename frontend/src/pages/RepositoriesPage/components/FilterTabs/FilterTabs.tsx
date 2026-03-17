import { Filter } from "../../types/types";

interface FilterTabsProps {
  active: Filter;
  onChange: (f: Filter) => void;
  counts: Record<Filter, number>;
}

const TABS: { label: string; value: Filter }[] = [
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
    <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-elevated">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
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
