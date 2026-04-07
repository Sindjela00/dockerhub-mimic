import { useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";
import { Role } from "../../../../context/types/types";
import UserDropdown from "../UserDropdown/UserDropdown";

interface UserMenuProps {
  email: string;
  role?: Role;
  username?: string;
}

export default function UserMenu({ email, role, username }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
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
          {email.slice(0, 2).toUpperCase()}
        </div>

        <span className="text-xs font-medium text-text-primary hidden md:block">
          {username}
        </span>

        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <UserDropdown
          email={email}
          role={role}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
