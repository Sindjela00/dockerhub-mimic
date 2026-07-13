import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "../Modal";
import { Repository } from "@/services/repositories/repositories.api";
import { Search } from "lucide-react";
import { TagComponent } from "@/components/Tag/Tag";

interface AddTeamRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (repositoryId: number, permission: string) => Promise<void>;
  availableRepositories: Repository[];
  alreadyAddedIds: number[];
}

const PERMISSIONS = [
  { label: "read", key: "read-only" },
  { label: "write", key: "read+write" },
  { label: "admin", key: "admin" },
] as const;

type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export default function AddTeamRepositoryModal({
  isOpen,
  onClose,
  onSave,
  availableRepositories,
  alreadyAddedIds,
}: AddTeamRepositoryModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionKey>("read-only");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedId(null);
      setPermission("read-only");
      setError(null);
    }
  }, [isOpen]);

  const filtered = availableRepositories.filter(
    (r) =>
      !alreadyAddedIds.includes(r.id) &&
      r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!selectedId) {
      setError("Please select a repository.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(selectedId, permission);
      onClose();
    } catch {
      setError("Failed to add repository. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add repository to team"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {/* Search */}
        <InputField
          value={search}
          onChange={setSearch}
          placeholder="Search repositories..."
          startIcon={<Search size={13} />}
        />

        {/* Repository list */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              No repositories available.
            </p>
          ) : (
            filtered.map((repo) => (
              <button
                key={repo.id}
                onClick={() => setSelectedId(repo.id)}
                className={[
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg",
                  "border text-left transition-colors",
                  selectedId === repo.id
                    ? "border-brand bg-brand-muted"
                    : "border-border bg-bg-surface hover:bg-bg-elevated",
                ].join(" ")}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-text-primary font-mono truncate">
                    {repo.name}
                  </span>
                  {repo.description && (
                    <span className="text-[11px] text-text-muted truncate">
                      {repo.description}
                    </span>
                  )}
                </div>
                <TagComponent
                  accentClass={
                    repo.visibility === "public" ? "success" : "danger"
                  }
                >
                  {repo.visibility}
                </TagComponent>
              </button>
            ))
          )}
        </div>

        {/* Permission */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Permission
          </label>
          <div className="flex gap-2">
            {PERMISSIONS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPermission(p.key)}
                className={[
                  "flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors",
                  permission === p.key
                    ? "border-brand bg-brand-muted text-brand"
                    : "border-border bg-bg-surface text-text-muted hover:text-text-primary hover:border-border-hover",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedId || loading}
          >
            {loading ? "Adding..." : "Add repository"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
