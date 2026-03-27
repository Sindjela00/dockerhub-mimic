import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  maxVisible?: number;
}

function getPageNumbers(
  current: number,
  totalPages: number,
  maxVisible: number,
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: (number | "...")[] = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onChange,
  maxVisible = 5,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages, maxVisible);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const btnBase = [
    "inline-flex items-center justify-center h-8 min-w-[32px] px-2 rounded-md",
    "text-xs font-medium transition-colors duration-100 select-none",
  ].join(" ");

  const btnActive = "bg-brand text-text-inverse";
  const btnDefault =
    "text-text-secondary hover:text-text-primary hover:bg-bg-elevated";
  const btnDisabled = "text-text-secondary opacity-40 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Info */}
      <p className="text-xs text-text-secondary">
        Showing{" "}
        <span className="text-text-primary font-medium">
          {Math.min((page - 1) * pageSize + 1, total)}–
          {Math.min(page * pageSize, total)}
        </span>{" "}
        of <span className="text-text-primary font-medium">{total}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => hasPrev && onChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
          className={[btnBase, hasPrev ? btnDefault : btnDisabled].join(" ")}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="h-8 min-w-[32px] flex items-center justify-center
                         text-xs text-text-secondary"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={[btnBase, p === page ? btnActive : btnDefault].join(
                " ",
              )}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => hasNext && onChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className={[btnBase, hasNext ? btnDefault : btnDisabled].join(" ")}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
