import {
  CreateRepositoryModalProps,
  FormErrors,
  FormState,
  Owner,
} from "./types/types";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "@/components/Modals/Modal";
import { OwnerSelect } from "./components/OwnerSelect/OwnerSelect";
import { VisibilityToggle } from "./components/VisibilityToggle/VisibilityToggle";
import { useState } from "react";

const MOCK_ORGS: Owner[] = [
  { value: "acme-corp", label: "Acme Corp", type: "org" },
  { value: "dev-team", label: "Dev Team", type: "org" },
];

const INITIAL_FORM = (username: string): FormState => ({
  owner: username,
  name: "",
  description: "",
  visibility: "public",
});

export default function CreateRepositoryModal({
  isOpen,
  onClose,
  onCreate,
}: CreateRepositoryModalProps) {
  const username = "fakeUsername";
  const [form, setForm] = useState<FormState>(INITIAL_FORM(username));
  const [errors, setErrors] = useState<FormErrors>({});

  const owners: Owner[] = [
    { value: username, label: username, type: "user" },
    ...MOCK_ORGS,
  ];

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
      namespace: form.owner,
    });

    setForm(INITIAL_FORM(username));
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(INITIAL_FORM(username));
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create repository">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Owner */}
        <OwnerSelect
          value={form.owner}
          owners={owners}
          onChange={(v) => setForm((f) => ({ ...f, owner: v }))}
        />

        {/* Name */}
        <InputField
          label="Repository name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v.toLowerCase() }))}
          placeholder="image"
          error={errors.name}
          prefix={`${form.owner}/`}
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
