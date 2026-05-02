import { Trash2, Users } from "lucide-react";

import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import { getAccent } from "@/utils/accentStyle";

const PERMISSIONS = [
  { label: "Read", key: "read-only" },
  { label: "Write", key: "read+write" },
  { label: "Admin", key: "admin" },
] as const;

type Permission = (typeof PERMISSIONS)[number]["key"];

const permissionStyles: Record<Permission, string> = {
  "read-only": "text-brand",
  "read+write": "text-warning",
  admin: "text-danger",
};

interface TeamCardProps {
  id: string;
  name: string;
  memberCount: number;
  accentClass: string;
  permission?: string;
  onPermissionChange?: (teamId: string, permission: string) => void;
  onClick?: (teamId: string) => void;
  onRemove?: () => void;
}

export function TeamCard({
  id,
  name,
  memberCount,
  accentClass,
  permission,
  onPermissionChange,
  onClick,
  onRemove,
}: TeamCardProps) {
  const accent = getAccent(accentClass);

  return (
    <div
      onClick={() => onClick?.(id)}
      className="bg-bg-surface border border-border rounded-xl p-4 flex flex-col gap-3
                 hover:border-border-strong transition-all cursor-pointer group relative overflow-hidden"
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${accent.bg}
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
      />

      <div className="flex items-center justify-between gap-3">
        {/* Left: avatar + name + members */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            initials={<Users size={15} className={accent.text} />}
            size="md"
            rounded="rounded-md"
          />
          <div className="min-w-0">
            <p className="text-sm text-text-primary font-mono truncate">
              {name}
            </p>
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <Users size={11} />
              {memberCount} members
            </span>
          </div>
        </div>

        {/* Right: permission select + trash */}
        {(onPermissionChange || onRemove) && (
          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {permission !== undefined && onPermissionChange && (
              <select
                value={permission}
                onChange={(e) => onPermissionChange(id, e.target.value)}
                className={`
                  text-[11px] font-medium bg-transparent border-none
                  outline-none cursor-pointer
                  ${permissionStyles[permission as Permission] ?? "text-text-muted"}
                `}
              >
                {PERMISSIONS.map((p) => (
                  <option
                    key={p.key}
                    value={p.key}
                    className="bg-bg-surface text-text-primary"
                  >
                    {p.label}
                  </option>
                ))}
              </select>
            )}

            {onRemove && (
              <Button
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
