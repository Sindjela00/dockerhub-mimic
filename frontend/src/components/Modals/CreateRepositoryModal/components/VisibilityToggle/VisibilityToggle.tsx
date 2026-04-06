import { RepoVisibility } from "@/pages/RepositoriesPage/types/types";

interface VisibilityToggleProps {
  value: RepoVisibility;
  onChange: (v: RepoVisibility) => void;
}

export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-primary">Visibility</p>
      <div className="flex gap-2">
        {(["public", "private"] as RepoVisibility[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3",
              "rounded-lg border text-xs font-medium transition-colors duration-100",
              value === v
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-bg-elevated text-text-muted hover:text-text-primary hover:border-border-strong",
            ].join(" ")}
          >
            <span
              className={[
                "w-2 h-2 rounded-full",
                v === "public" ? "bg-success" : "bg-text-muted",
              ].join(" ")}
            />
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">
        {value === "public"
          ? "Anyone can pull this image."
          : "Only you and your team can access this image."}
      </p>
    </div>
  );
}
