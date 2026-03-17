export interface ColumnDef<T extends object> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
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
}
