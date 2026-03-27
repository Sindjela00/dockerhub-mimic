import { LayoutGrid, List } from "lucide-react";

import { ViewMode } from "../../types/types";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex h-10 items-stretch gap-1 p-1 rounded-lg bg-bg-elevated
                    border border-border"
    >
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        className={[
          "flex items-center justify-center px-2.5 rounded-md",
          "transition-colors duration-100 cursor-pointer",
          view === "grid"
            ? "bg-bg-surface text-text-primary border border-border"
            : "text-text-muted hover:text-text-primary",
        ].join(" ")}
      >
        <LayoutGrid size={14} />
      </button>
      <button
        onClick={() => onChange("table")}
        aria-label="Table view"
        className={[
          "flex items-center justify-center px-2.5 rounded-md",
          "transition-colors duration-100 cursor-pointer",
          view === "table"
            ? "bg-bg-surface text-text-primary border border-border"
            : "text-text-muted hover:text-text-primary",
        ].join(" ")}
      >
        <List size={14} />
      </button>
    </div>
  );
}
