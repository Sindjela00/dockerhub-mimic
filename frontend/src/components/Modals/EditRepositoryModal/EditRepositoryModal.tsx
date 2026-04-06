import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modals/Modal";
import type { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import { Repository } from "@/services/repositories/repositories.api";
import { useEditRepository } from "@/services/repositories/useEditRepository/useEditRepository";

interface FormState {
  description: string;
  visibility: RepoVisibility;
}

interface EditRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    updated: Pick<Repository, "id" | "description" | "visibility">,
  ) => void;
  repo: Repository | null;
}

interface VisibilityToggleProps {
  value: RepoVisibility;
  onChange: (v: RepoVisibility) => void;
}

function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-primary">Visibility</p>
      <div className="flex gap-2">
        {(["public", "private"] as RepoVisibility[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3",
              "rounded-lg border text-xs font-medium transition-colors duration-100",
              value === v
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-bg-elevated text-text-muted hover:text-text-primary hover:border-border-strong",
            ].join(" ")}
          >
            <span
              className={[
                "w-2 h-2 rounded-full",
                v === "public" ? "bg-success" : "bg-text-muted",
              ].join(" ")}
            />
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">
        {value === "public"
          ? "Anyone can pull this image."
          : "Only you and your team can access this image."}
      </p>
    </div>
  );
}

export default function EditRepositoryModal({
  isOpen,
  onClose,
  onSave,
  repo,
}: EditRepositoryModalProps) {
  const [form, setForm] = useState<FormState>({
    description: "",
    visibility: "public",
  });

  const { saving, error, update } = useEditRepository();

  useEffect(() => {
    if (repo) {
      setForm({
        description: repo.description,
        visibility: repo.visibility,
      });
    }
  }, [repo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo) return;

    const ok = await update({
      id: repo.id,
      name: repo.name,
      description: form.description.trim(),
      visibility: form.visibility,
    });

    if (ok) {
      onSave({
        id: repo.id,
        description: form.description.trim(),
        visibility: form.visibility,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${repo?.fullName}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Repo name — read only info */}
        <div className="px-3 py-2 rounded-lg bg-bg-elevated border border-border">
          <p className="text-xs text-text-muted">Repository</p>
          <p className="text-sm font-medium text-text-primary mt-0.5">
            {repo?.fullName}
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-primary">
            Description
            <span className="text-text-muted font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Short description of your image..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-md resize-none
                       bg-bg-elevated border border-border
                       text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:border-brand
                       transition-colors"
          />
        </div>

        {/* Visibility */}
        <VisibilityToggle
          value={form.visibility}
          onChange={(v) => setForm((f) => ({ ...f, visibility: v }))}
        />

        {/* Error */}
        {error && <p className="text-[11px] text-danger">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
