import { ShieldPlus, UserPlus } from "lucide-react";

import type { AdminSummary } from "@/services/admin/admin.api";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Loader from "@/components/Loader/Loader";
import Table from "@/components/Table/Table";
import { useCreateAdmin } from "@/services/admin/useCreateAdmin/useCreateAdmin";
import { useListAdmins } from "@/services/admin/useListAdmins/useListAdmins";
import { useState } from "react";

interface FormState {
  username: string;
  email: string;
}

export default function AdminUsersPage() {
  const { admins, loading, error: listError, refetch } = useListAdmins();
  const {
    loading: creating,
    error: createError,
    handleCreateAdmin,
  } = useCreateAdmin();

  const [form, setForm] = useState<FormState>({ username: "", email: "" });
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemporaryPassword(null);

    const result = await handleCreateAdmin(form);
    if (result) {
      setTemporaryPassword(result.temporaryPassword);
      setForm({ username: "", email: "" });
      refetch();
    }
  };

  return (
    <div className="mx-auto flex flex-col gap-6">
      <div className="bg-bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
          <UserPlus size={16} />
          Create administrator
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Only the super-administrator can create new administrator accounts.
          The new admin receives a temporary password and must change it on
          first login.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <InputField
            label="Username"
            value={form.username}
            onChange={(v) => setForm((f) => ({ ...f, username: v }))}
            placeholder="jsmith"
            className="flex-1"
          />
          <InputField
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="jsmith@example.com"
            className="flex-1"
          />
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={creating || !form.username || !form.email}
          >
            <ShieldPlus size={15} />
            Create
          </Button>
        </form>

        {createError && (
          <p className="text-xs text-danger mt-3">{createError}</p>
        )}

        {temporaryPassword && (
          <div className="mt-4 rounded-lg border border-warning bg-warning-muted px-4 py-3">
            <p className="text-xs font-medium text-text-primary mb-1">
              Temporary password (shown only once)
            </p>
            <code className="text-sm text-text-primary break-all">
              {temporaryPassword}
            </code>
          </div>
        )}
      </div>

      <div className="bg-bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Administrators
        </h2>

        {loading ? (
          <Loader />
        ) : listError ? (
          <p className="text-xs text-danger">{listError}</p>
        ) : (
          <Table<AdminSummary>
            columns={[
              {
                key: "username",
                header: "Username",
                render: (a) => a.username,
              },
              { key: "email", header: "Email", render: (a) => a.email },
              {
                key: "mustChangePassword",
                header: "Status",
                render: (a) =>
                  a.mustChangePassword ? "Pending password change" : "Active",
              },
            ]}
            data={admins}
            rowKey={(a) => a.username}
            emptyText="No administrators yet."
          />
        )}
      </div>
    </div>
  );
}
