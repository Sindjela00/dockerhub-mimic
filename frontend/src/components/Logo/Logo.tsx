import { LogoProps } from "./types/types";

const sizeStyles = {
  sm: "w-7 h-7 text-[11px] rounded-md",
  md: "w-10 h-10 text-sm rounded-lg",
  lg: "w-14 h-14 text-base rounded-xl",
};

export default function Logo({ size = "md" }: LogoProps) {
  return (
    <div
      className={`${sizeStyles[size]} flex items-center justify-center font-bold select-none`}
      style={{
        background: "var(--color-brand)",
        color: "var(--color-text-inverse)",
      }}
    >
      UKS
    </div>
  );
}
