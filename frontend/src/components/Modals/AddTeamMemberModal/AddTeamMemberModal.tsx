import { useEffect, useState } from "react";

import { Avatar } from "@/components/Avatar/Avatar";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "../Modal";
import { OrganizationMember } from "@/services/organizations/organizations.api";
import { Search } from "lucide-react";
import { TagComponent } from "@/components/Tag/Tag";
import { getInitials } from "@/utils/getInitials";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number) => Promise<void>;
  availableMembers: OrganizationMember[];
}

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  onSave,
  availableMembers,
}: AddTeamMemberModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedId(null);
      setError(null);
    }
  }, [isOpen]);

  const filtered = availableMembers.filter(
    (m) =>
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!selectedId) {
      setError("Please select a member.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(selectedId);
      onClose();
    } catch {
      setError("Failed to add member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add member to team"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <InputField
          value={search}
          onChange={setSearch}
          placeholder="Search members..."
          startIcon={<Search size={13} />}
        />

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              No members available.
            </p>
          ) : (
            filtered.map((member) => (
              <button
                key={member.userId}
                onClick={() => setSelectedId(member.userId)}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
                  selectedId === member.userId
                    ? "border-brand bg-brand-muted"
                    : "border-border bg-bg-surface hover:bg-bg-elevated",
                ].join(" ")}
              >
                <Avatar
                  initials={getInitials(member.username)}
                  rounded="rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {member.username}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">
                    {member.email}
                  </p>
                </div>
                <TagComponent
                  accentClass={
                    member.role === "owner"
                      ? "warning"
                      : member.role === "admin"
                        ? "info"
                        : "brand"
                  }
                >
                  {member.role}
                </TagComponent>
              </button>
            ))
          )}
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!selectedId || loading}
          >
            {loading ? "Adding..." : "Add member"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
