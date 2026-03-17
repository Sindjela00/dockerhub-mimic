import { BookMarked, ChevronDown } from "lucide-react";
import {
  CreateRepositoryModalProps,
  FormErrors,
  FormState,
  Owner,
} from "./types/types";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "@/components/Modal/Modal";
import type { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import { useState } from "react";

const MOCK_ORGS: Owner[] = [
  { value: "acme-corp", label: "Acme Corp", type: "org" },
  { value: "dev-team", label: "Dev Team", type: "org" },
];

interface OwnerSelectProps {
  value: string;
  owners: Owner[];
  onChange: (v: string) => void;
}

function OwnerSelect({ value, owners, onChange }: OwnerSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = owners.find((o) => o.value === value) ?? owners[0];

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-xs font-medium text-text-primary">Owner</label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 px-3 py-2
                   rounded-md bg-bg-elevated border border-border
                   text-sm text-text-primary
                   hover:border-border-strong transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full bg-brand-muted flex items-center
                          justify-center text-[10px] font-bold text-brand"
          >
            {selected.label.slice(0, 1).toUpperCase()}
          </div>
          <span>{selected.label}</span>
          <span
            className="text-[10px] text-text-muted px-1.5 py-0.5 rounded-full
                           bg-bg-surface border border-border"
          >
            {selected.type === "user" ? "Personal" : "Organization"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-150
                      ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-10
                        bg-bg-surface border border-border rounded-lg
                        overflow-hidden shadow-lg"
        >
          {owners.map((owner) => (
            <button
              key={owner.value}
              type="button"
              onClick={() => {
                onChange(owner.value);
                setOpen(false);
              }}
              className={[
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm",
                "hover:bg-bg-elevated transition-colors text-left",
                owner.value === value ? "text-brand" : "text-text-primary",
              ].join(" ")}
            >
              <div
                className="w-5 h-5 rounded-full bg-brand-muted flex items-center
                              justify-center text-[10px] font-bold text-brand"
              >
                {owner.label.slice(0, 1).toUpperCase()}
              </div>
              <span>{owner.label}</span>
              <span
                className="ml-auto text-[10px] text-text-muted px-1.5 py-0.5
                               rounded-full bg-bg-elevated border border-border"
              >
                {owner.type === "user" ? "Personal" : "Organization"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
