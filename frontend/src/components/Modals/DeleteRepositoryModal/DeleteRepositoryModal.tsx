import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "@/components/Modals/Modal";
import { Repository } from "@/services/repositories/repositories.api";
import { TriangleAlert } from "lucide-react";
import { useDeleteRepository } from "@/services/repositories/useDeleteRepository/useDeleteRepository";
import { useState } from "react";

interface DeleteRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  repo: Repository | null;
}

export default function DeleteRepositoryModal({
  isOpen,
  onClose,
  onDelete,
  repo,
}: DeleteRepositoryModalProps) {
  const [confirm, setConfirm] = useState("");
  const { loading, error, handleDelete } = useDeleteRepository();

  const fullName = `${repo?.fullName ?? ""}`;
  const isConfirmed = confirm === fullName;

  const handleConfirm = async () => {
    if (!repo || !isConfirmed) return;
    const success = await handleDelete(repo.id);
    if (success) {
      setConfirm("");
      onDelete();
      onClose();
    }
  };

  const handleClose = () => {
    setConfirm("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete repository">
      <div className="flex flex-col gap-5">
        {/* Warning */}
        <div
          className="flex gap-3 px-4 py-3 rounded-lg
                        bg-danger-muted border border-danger/20"
        >
          <TriangleAlert size={16} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-danger mb-1">
              This action cannot be undone.
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Deleting{" "}
              <span className="text-text-primary font-medium">{fullName}</span>{" "}
              will permanently remove all tags, images and settings.
            </p>
          </div>
        </div>

        <InputField
          label={`Type "${fullName}" to confirm`}
          value={confirm}
          onChange={setConfirm}
          placeholder={fullName}
        />

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
          >
            {loading ? "Deleting..." : "Delete repository"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
