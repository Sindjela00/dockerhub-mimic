import type { ReactNode } from "react";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
}

export default function Tabs<T extends string = string>({
  tabs,
  active,
  onChange,
}: TabsProps<T>) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
            "border-b-2 -mb-px transition-colors",
            active === tab.value
              ? "border-brand text-brand"
              : "border-transparent text-text-muted hover:text-text-primary",
          ].join(" ")}
        >
          {tab.icon && <span className="flex items-center">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={[
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                active === tab.value
                  ? "bg-brand-muted text-brand"
                  : "bg-bg-elevated text-text-muted",
              ].join(" ")}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
