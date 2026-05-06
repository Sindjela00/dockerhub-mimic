import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "../Modal";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  title: string;
  entityName: string;
  description?: string | React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onDelete,
  title,
  entityName,
  description,
  loading = false,
  error = null,
}: DeleteConfirmModalProps) {
  const [confirm, setConfirm] = useState("");

  const isConfirmed = confirm === entityName;

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    await onDelete();
    setConfirm("");
  };

  const handleClose = () => {
    setConfirm("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 px-4 py-3 rounded-lg bg-error-muted border border-error/20">
          <TriangleAlert size={16} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-error mb-1">
              This action cannot be undone.
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {description ?? (
                <>
                  Deleting{" "}
                  <span className="text-text-primary font-medium">
                    {entityName}
                  </span>{" "}
                  will permanently remove all associated data.
                </>
              )}
            </p>
          </div>
        </div>

        <InputField
          label={`Type "${entityName}" to confirm`}
          value={confirm}
          onChange={setConfirm}
          placeholder={entityName}
        />

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="danger"
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
            {loading ? "Deleting..." : `Delete ${entityName}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
