import { getAccent } from "@/utils/accentStyle";

interface AvatarProps {
  initials: string;
  accentClass: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ initials, accentClass, size = "md" }: AvatarProps) {
  const accent = getAccent(accentClass);

  const sizeClasses = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  }[size];

  return (
    <div
      className={`${sizeClasses} min-w-fit rounded-full flex items-center justify-center font-bold font-mono
        ${accent.bg} ${accent.text} border ${accent.border}`}
    >
      {initials}
    </div>
  );
}
