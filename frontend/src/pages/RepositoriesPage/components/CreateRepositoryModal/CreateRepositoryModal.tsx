import {
  CreateRepositoryModalProps,
  FormErrors,
  FormState,
  VisibilityToggleProps,
} from "./types/types";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "@/components/Modal/Modal";
import type { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import { useState } from "react";

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
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 cursor-pointer",
              "rounded-lg border text-xs font-medium transition-colors duration-100",
              value === v
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong",
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

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  visibility: "public",
};

export default function CreateRepositoryModal({
  isOpen,
  onClose,
  onCreate,
  namespace,
}: CreateRepositoryModalProps) {
  console.log(isOpen);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.name.trim()) next.name = "Repository name is required.";
    else if (!/^[a-z0-9._-]+$/.test(form.name))
      next.name =
        "Only lowercase letters, numbers, dots, hyphens and underscores.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onCreate({
      name: form.name.trim(),
      description: form.description.trim(),
      visibility: form.visibility,
      namespace,
    });

    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create repository">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <InputField
          label="Repository name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v.toLowerCase() }))}
          placeholder="Name"
          error={errors.name}
        />

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

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create repository
          </Button>
        </div>
      </form>
    </Modal>
  );
}
