import {
  ALIGN_CLASS,
  HIDE_CLASS,
  SortDirection,
  TableProps,
} from "./types/types";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

function SortIcon({ direction }: { direction: SortDirection | null }) {
  if (direction === "asc") return <ChevronUp size={12} className="shrink-0" />;
  if (direction === "desc")
    return <ChevronDown size={12} className="shrink-0" />;
  return <ChevronsUpDown size={12} className="shrink-0 opacity-40" />;
}

export default function Table<T extends object>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyText = "No data available.",
  sortKey,
  sortDir,
  onSort,
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDir: SortDirection =
      sortKey === key && sortDir === "asc" ? "desc" : "asc";
    onSort(key, newDir);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr className="border-b border-border bg-bg-elevated">
            {columns.map((col) => {
              const isSortable = !!col.sortable && !!onSort;
              const isActive = sortKey === col.key;

              return (
                <th
                  key={col.key}
                  onClick={isSortable ? () => handleSort(col.key) : undefined}
                  className={[
                    "px-4 py-3 text-xs font-medium text-text-primary",
                    ALIGN_CLASS[col.align ?? "left"],
                    col.hideBelow ? HIDE_CLASS[col.hideBelow] : "",
                    col.width ?? "",
                    isSortable
                      ? "cursor-pointer select-none hover:text-text-primary transition-colors"
                      : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex items-center gap-1",
                      col.align === "right" ? "flex-row-reverse" : "",
                    ].join(" ")}
                  >
                    {col.header}
                    {isSortable && (
                      <SortIcon
                        direction={isActive ? (sortDir ?? null) : null}
                      />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-text-secondary"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={[
                  "transition-colors duration-100",
                  onRowClick ? "cursor-pointer hover:bg-bg-elevated" : "",
                  i !== data.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "px-4 py-3",
                      ALIGN_CLASS[col.align ?? "left"],
                      col.hideBelow ? HIDE_CLASS[col.hideBelow] : "",
                    ].join(" ")}
                  >
                    {row ? col.render(row) : "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
