import { KeyIcon, LogOut, Moon, Sun } from "lucide-react";
import { useAppContext, useTheme } from "@/context/AppContext";

import { Role } from "@/context/types/types";
import { useNavigate } from "react-router-dom";

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function DropdownItem({ icon, label, onClick, danger }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-md",
        "transition-colors duration-100",
        danger
          ? "text-danger hover:bg-danger-muted"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

interface UserDropdownProps {
  email: string;
  role?: Role;
  onClose: () => void;
}

export default function UserDropdown({
  email,
  role,
  onClose,
}: UserDropdownProps) {
  const navigate = useNavigate();
  const { clearAuth } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/landing");
    onClose();
  };

  return (
    <div
      className="absolute right-0 top-full mt-1.5 w-56
                    bg-bg-surface border border-border rounded-lg
                    overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-medium text-text-primary truncate">
          {email}
        </p>
        <p className="text-[11px] text-text-muted">{role}</p>
      </div>

      <div className="p-1">
        <DropdownItem
          icon={theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          label={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={toggleTheme}
        />
        <DropdownItem
          icon={<KeyIcon size={14} />}
          label="Change password"
          onClick={() => handleNavigate("/change-password")}
        />
      </div>
      <div className="p-1 border-t border-border">
        <DropdownItem
          icon={<LogOut size={14} />}
          label="Log out"
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  );
}
