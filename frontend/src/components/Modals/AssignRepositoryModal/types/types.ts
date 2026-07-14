export const PERMISSIONS = [
  { label: "Read", key: "read-only" },
  { label: "Write", key: "read+write" },
  { label: "Admin", key: "admin" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
