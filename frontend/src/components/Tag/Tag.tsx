// Tag.tsx

import type { ReactNode } from "react";
import { getAccent } from "@/utils/accentStyle";

interface TagProps {
  children: ReactNode;
  accentClass: string;
  size?: "sm" | "md";
  clickable?: boolean;
  onClick?: () => void;
}

export function Tag({
  children,
  accentClass,
  size = "md",
  clickable = false,
  onClick,
}: TagProps) {
  const accent = getAccent(accentClass);

  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
  }[size];

  return (
    <span
      onClick={clickable ? onClick : undefined}
      className={`inline-flex items-center gap-1 font-medium rounded-full
        ${sizeClasses} ${accent.bg} ${accent.text} border ${accent.border}
        ${clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
      `}
    >
      {children}
    </span>
  );
}
