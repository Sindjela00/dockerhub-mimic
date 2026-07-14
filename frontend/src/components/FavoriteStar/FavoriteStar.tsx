import Button from "../Button/Button";
import { Star } from "lucide-react";

interface FavoriteStarProps {
  starred: boolean;
  count?: number;
  loading?: boolean;
  onToggle: () => void;
  disableStarring?: boolean;
}

export default function FavoriteStar({
  starred,
  count,
  loading = false,
  onToggle,
  disableStarring = false,
}: FavoriteStarProps) {
  if (!starred && disableStarring) {
    return null;
  }

  return (
    <Button
      size="xs"
      onClick={onToggle}
      disabled={loading}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
        "text-xs font-medium border transition-colors duration-150",
        starred
          ? "bg-brand-subtle border-brand text-brand hover:bg-brand-muted"
          : "bg-bg-elevated border-border text-text-muted hover:text-text-primary hover:border-border-strong",
      ].join(" ")}
      title={starred ? "Remove from favorites" : "Add to favorites"}
    >
      <Star size={13} className={starred ? "fill-brand text-brand" : ""} />
      <span>{starred ? "Starred" : "Star"}</span>
      {count !== undefined && (
        <span
          className={[
            "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
            starred
              ? "bg-brand-muted text-brand"
              : "bg-bg-surface text-text-muted",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </Button>
  );
}
