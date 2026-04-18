export const ACCENT_CLASSES = [
  "brand",
  "info",
  "success",
  "warning",
  "danger",
  "ghost",
] as const;

export type AccentClass = (typeof ACCENT_CLASSES)[number];

const ACCENT_MAP: Record<string, { bg: string; text: string; border: string }> =
  {
    brand: {
      bg: "bg-brand-muted",
      text: "text-brand",
      border: "border-brand/20",
    },
    info: {
      bg: "bg-info-muted",
      text: "text-info",
      border: "border-info/20",
    },
    success: {
      bg: "bg-success-muted",
      text: "text-success",
      border: "border-success/20",
    },
    warning: {
      bg: "bg-warning-muted",
      text: "text-warning",
      border: "border-warning/20",
    },
    danger: {
      bg: "bg-danger-muted",
      text: "text-danger",
      border: "border-danger/20",
    },
    ghost: {
      bg: "bg-transparent",
      text: "text-text-muted",
      border: "border-border",
    },
  };

export function getAccent(key: string) {
  return ACCENT_MAP[key] ?? ACCENT_MAP.brand;
}

export function getRoleAccent(role: string): "warning" | "info" | "brand" {
  switch (role.toLowerCase()) {
    case "owner":
      return "warning";
    case "admin":
      return "info";
    case "member":
      return "brand";
    default:
      return "brand";
  }
}
