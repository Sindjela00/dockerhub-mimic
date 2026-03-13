import { ChevronDown } from "lucide-react";

interface UserMenuProps {
  username: string;
  plan: string;
}

export default function UserMenu({ username, plan }: UserMenuProps) {
  return (
    <button
      className="flex items-center gap-2.5 px-2.5 py-1.5
                 rounded-md hover:bg-bg-elevated transition-colors"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center
                   text-[11px] font-medium select-none"
        style={{
          background: "var(--color-brand-muted)",
          color: "var(--color-brand)",
        }}
      >
        {username.slice(0, 2).toUpperCase()}
      </div>

      <div className="text-left hidden md:block">
        <p className="text-xs font-medium text-text-primary leading-tight">
          {username}
        </p>
        <p className="text-[11px] text-text-muted leading-tight">{plan} plan</p>
      </div>

      <ChevronDown size={14} className="text-text-muted" />
    </button>
  );
}
