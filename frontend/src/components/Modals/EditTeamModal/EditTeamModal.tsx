import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "../Modal";

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  initialValues: {
    name: string;
    description: string;
  };
}

export default function EditTeamModal({
  isOpen,
  onClose,
  onSave,
  initialValues,
}: EditTeamModalProps) {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialValues.name);
      setDescription(initialValues.description);
      setError(null);
    }
  }, [isOpen, initialValues]);

  const handleClose = () => {
    setName(initialValues.name);
    setDescription(initialValues.description);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Team name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch {
      setError("Failed to update team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit team">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Team name <span className="text-error">*</span>
          </label>
          <InputField
            value={name}
            onChange={setName}
            placeholder="e.g. frontend, devops"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team work on?"
            rows={3}
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2
                       text-sm text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:ring-1 focus:ring-brand
                       resize-none transition-colors"
          />
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
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
