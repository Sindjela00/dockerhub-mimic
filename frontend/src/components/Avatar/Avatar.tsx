import React from "react";

export function Avatar({
  initials,
  size = "md",
  rounded = "rounded-full",
}: {
  initials: string | React.ReactNode;
  size?: "sm" | "md" | "lg";
  rounded?: "rounded-full" | "rounded-md";
}) {
  const sizeClasses = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  }[size];

  return (
    <div
      className={`${sizeClasses} min-w-fit ${rounded} flex items-center justify-center font-mono
        bg-brand-muted text-text-primary border border-brand/20`}
    >
      {initials}
    </div>
  );
}
