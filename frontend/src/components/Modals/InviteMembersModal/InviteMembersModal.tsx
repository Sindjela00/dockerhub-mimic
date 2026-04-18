import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "../Modal";
import { useState } from "react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { identifier: string; role: string }) => Promise<void>;
}

const ROLES = ["owner", "admin", "member"];

export default function InviteMemberModal({
  isOpen,
  onClose,
  onSave,
}: InviteMemberModalProps) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setUsername("");
    setRole("member");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({ identifier: username.trim(), role });
      handleClose();
    } catch {
      setError("Failed to invite member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite member">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Username <span className="text-error">*</span>
          </label>
          <InputField
            value={username}
            onChange={setUsername}
            placeholder="e.g. johndoe"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Role
          </label>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={[
                  "flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors",
                  role === r
                    ? "border-brand bg-brand-muted text-brand"
                    : "border-border bg-bg-surface text-text-muted hover:text-text-primary hover:border-border-hover",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Inviting..." : "Invite member"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
