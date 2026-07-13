import { Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import InputField from "@/components/InputField/InputField";
import Loader from "@/components/Loader/Loader";
import Table from "@/components/Table/Table";
import type { ColumnDef } from "@/components/Table/types/types";
import type { UserBadgeSummary } from "@/services/admin/admin.api";
import { useUserBadges } from "@/services/admin/useUserBadges/useUserBadges";

export default function AdminBadgesPage() {
  const { users, total, loading, error, search, toggleBadge } =
    useUserBadges();
  const [queryText, setQueryText] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (value: string) => {
    setQueryText(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => search(value), 300);
  };

  const columns: ColumnDef<UserBadgeSummary>[] = [
    { key: "username", header: "Username", render: (u) => u.username },
    { key: "email", header: "Email", render: (u) => u.email },
    {
      key: "verified",
      header: "Verified Publisher",
      align: "center",
      render: (u) => (
        <label className="inline-flex items-center gap-1.5 cursor-pointer justify-center">
          <input
            type="checkbox"
            checked={u.verifiedPublisher}
            onChange={(e) =>
              toggleBadge(u.id, "verified", e.target.checked)
            }
            className="rounded border-border text-brand focus:ring-brand focus:ring-offset-0 focus:ring-2 cursor-pointer"
          />
          <ShieldCheck size={13} className="text-text-muted" />
        </label>
      ),
    },
    {
      key: "sponsored",
      header: "Sponsored OSS",
      align: "center",
      render: (u) => (
        <label className="inline-flex items-center gap-1.5 cursor-pointer justify-center">
          <input
            type="checkbox"
            checked={u.sponsoredOSS}
            onChange={(e) =>
              toggleBadge(u.id, "sponsored", e.target.checked)
            }
            className="rounded border-border text-brand focus:ring-brand focus:ring-offset-0 focus:ring-2 cursor-pointer"
          />
          <Sparkles size={13} className="text-text-muted" />
        </label>
      ),
    },
  ];

  return (
    <div className="mx-auto flex flex-col gap-6">
      <div className="bg-bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          User badges
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Search ordinary users and grant the Verified Publisher or Sponsored
          OSS badge. Badges are shown on the user's repositories in Explore.
        </p>

        <InputField
          value={queryText}
          onChangeRaw={(e) => handleSearchChange(e.target.value)}
          placeholder="Search users by username or email..."
          startIcon={<Search size={14} />}
          className="max-w-sm mb-4"
        />

        {error && <p className="text-xs text-danger mb-3">{error}</p>}

        {loading ? (
          <Loader />
        ) : (
          <Table<UserBadgeSummary>
            columns={columns}
            data={users}
            rowKey={(u) => String(u.id)}
            emptyText="No users found."
          />
        )}

        {!loading && users.length > 0 && (
          <p className="text-[11px] text-text-muted mt-3">
            {total} {total === 1 ? "user" : "users"} found
          </p>
        )}
      </div>
    </div>
  );
}
