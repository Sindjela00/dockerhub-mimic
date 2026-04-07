export type SortDirection = "asc" | "desc";

export interface ColumnDef<T extends object> {
  key: string;
  header: string | React.ReactNode;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg";
  width?: string;
}

export interface TableProps<T extends object> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  sortKey?: string;
  sortDir?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
}

export const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export const HIDE_CLASS: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};
