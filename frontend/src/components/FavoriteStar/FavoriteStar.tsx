import Button from "../Button/Button";
import { Star } from "lucide-react";
import { useState } from "react";

interface FavoriteStarProps {
  initialStarred?: boolean;
  count?: number;
  onToggle?: (starred: boolean) => void;
}

export default function FavoriteStar({
  initialStarred = false,
  count,
  onToggle,
}: FavoriteStarProps) {
  const [starred, setStarred] = useState(initialStarred);

  const handleClick = () => {
    const next = !starred;
    setStarred(next);
    onToggle?.(next);
  };

  return (
    <Button
      size="xs"
      onClick={handleClick}
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
          {count + (starred && !initialStarred ? 1 : 0)}
        </span>
      )}
    </Button>
  );
}
