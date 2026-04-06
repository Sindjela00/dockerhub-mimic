interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "w-3.5 h-3.5 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-7 h-7 border-[3px]",
};

export default function Loader({ size = "md", className = "" }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={[
          "rounded-full border-brand border-t-transparent animate-spin",
          SIZE_CLASS[size],
        ].join(" ")}
      />
    </div>
  );
}
