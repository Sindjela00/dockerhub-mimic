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
  };

export function getAccent(key: string) {
  return ACCENT_MAP[key] ?? ACCENT_MAP.brand;
}
