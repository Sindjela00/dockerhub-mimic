import type { FormErrors, FormState } from "./types/types";

import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "@/components/Modals/Modal";
import type { RepoVisibility } from "@/pages/RepositoriesPage/types/types";
import { VisibilityToggle } from "./components/VisibilityToggle/VisibilityToggle";
import { isAdminRole } from "@/context/types/types";
import { useAuth } from "@/context/AppContext";
import { useCreateRepository } from "@/services/repositories/useCreateRepository/useCreateRepository";
import { useOrganizationRepositories } from "@/services/organizations/useOrganizationRepositories/useOrganizationRepositories";
import { useState } from "react";

interface OrgOwner {
  name: string;
  displayName: string;
}

interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  username: string;
  owner?: OrgOwner;
}

const INITIAL_FORM = (): FormState => ({
  name: "",
  description: "",
  visibility: "public",
  owner: "",
  isOfficial: false,
});

export default function CreateRepositoryModal({
  isOpen,
  onClose,
  onCreate,
  username,
  owner = { name: "", displayName: "" },
}: CreateRepositoryModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM());
  const [errors, setErrors] = useState<FormErrors>({});

  const { role } = useAuth();
  const personalRepo = useCreateRepository();
  const orgRepo = useOrganizationRepositories(owner.name);

  const loading = username ? personalRepo.loading : orgRepo.creating;
  const apiError = username ? personalRepo.error : orgRepo.createError;

  const ownerLabel = username ? username : owner.displayName;
  const canCreateOfficial = !!username && isAdminRole(role);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Repository name is required.";
    else if (!/^[a-z0-9._-]+$/.test(form.name))
      next.name =
        "Only lowercase letters, numbers, dots, hyphens and underscores.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isOfficial = canCreateOfficial && form.isOfficial;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      visibility: isOfficial ? ("public" as RepoVisibility) : form.visibility,
      ...(isOfficial ? { isOfficial: true } : {}),
    };

    const repo = username
      ? await personalRepo.handleCreate(payload)
      : await orgRepo.handleCreate(payload);

    if (repo) {
      resetAndClose();
      onCreate();
    }
  };

  const resetAndClose = () => {
    setForm(INITIAL_FORM());
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Create new repository"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="group relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border">
            <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center">
              {username ? (
                <svg
                  className="w-3 h-3 text-brand"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 text-brand"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              )}
            </div>
            <div className="text-sm">
              {form.isOfficial ? (
                <span className="text-text-primary">
                  Official Docker Hub repository
                </span>
              ) : (
                <>
                  <span className="text-text-muted">Creating for </span>
                  <span className="text-text-primary">{ownerLabel}</span>
                  {!username &&
                    owner.name &&
                    owner.name !== owner.displayName && (
                      <span className="text-text-muted ml-1">
                        ({owner.name})
                      </span>
                    )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Official repository toggle (admins only) */}
        {canCreateOfficial && (
          <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-bg-elevated border border-border cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isOfficial}
              onChange={(e) =>
                setForm((f) => ({ ...f, isOfficial: e.target.checked }))
              }
              className="mt-0.5 rounded border-border text-brand focus:ring-brand focus:ring-offset-0 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm">
              <span className="text-text-primary font-medium">
                Official repository
              </span>
              <span className="block text-xs text-text-muted mt-0.5">
                No owner prefix, gets the Docker Official Image badge, and is
                always public.
              </span>
            </span>
          </label>
        )}

        {/* Repository Name */}
        <InputField
          label="Repository name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v.toLowerCase() }))}
          placeholder="my-image"
          error={errors.name}
          prefix={form.isOfficial ? undefined : `${ownerLabel}/`}
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
        {!form.isOfficial && (
          <VisibilityToggle
            value={form.visibility}
            onChange={(v) => setForm((f) => ({ ...f, visibility: v }))}
          />
        )}

        {apiError && <p className="text-xs text-danger">{apiError}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={resetAndClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create repository"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
