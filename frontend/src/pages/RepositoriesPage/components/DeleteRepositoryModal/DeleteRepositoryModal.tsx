import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "@/components/Modal/Modal";
import type { Repository } from "@/pages/RepositoriesPage/types/types";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";

interface DeleteRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  repo: Repository | null;
}

export default function DeleteRepositoryModal({
  isOpen,
  onClose,
  onDelete,
  repo,
}: DeleteRepositoryModalProps) {
  const [confirm, setConfirm] = useState("");

  const fullName = `${repo?.namespace}/${repo?.name}`;
  const isConfirmed = confirm === fullName;

  const handleDelete = () => {
    if (!repo || !isConfirmed) return;
    onDelete(repo.id);
    setConfirm("");
    onClose();
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
              will permanently remove all tags, images and settings associated
              with this repository.
            </p>
          </div>
        </div>

        {/* Confirm input */}
        <InputField
          label={`Type "${fullName}" to confirm`}
          value={confirm}
          onChange={setConfirm}
          placeholder={fullName}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={!isConfirmed}
          >
            Delete repository
          </Button>
        </div>
      </div>
    </Modal>
  );
}
