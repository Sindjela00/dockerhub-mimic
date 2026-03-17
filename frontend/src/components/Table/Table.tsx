import { TableProps } from "./types/types";

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

const HIDE_CLASS: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export default function Table<T extends object>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyText = "No data available.",
}: TableProps<T>) {
  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr className="border-b border-border bg-bg-elevated">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  "px-4 py-3 text-xs font-medium text-text-primary",
                  ALIGN_CLASS[col.align ?? "left"],
                  col.hideBelow ? HIDE_CLASS[col.hideBelow] : "",
                  col.width ?? "",
                ].join(" ")}
              >
                {col.header}
              </th>
            ))}
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
                    {col.render(row)}
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
