import { Building2, FileText, Link2 } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "../Modal";

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: {
    displayName: string;
    description: string;
    avatarUrl?: string;
  };
  onSave: (data: {
    displayName: string;
    description: string;
    avatarUrl: string;
  }) => void;
}

export default function EditOrganizationModal({
  isOpen,
  onClose,
  organization,
  onSave,
}: EditOrganizationModalProps) {
  const [displayName, setDisplayName] = useState(organization.displayName);
  const [description, setDescription] = useState(organization.description);
  const [avatarUrl, setAvatarUrl] = useState(organization.avatarUrl || "");
  const [errors, setErrors] = useState<{
    displayName?: string;
    description?: string;
  }>({});

  // Reset form when organization changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(organization.displayName);
      setDescription(organization.description);
      setAvatarUrl(organization.avatarUrl || "");
      setErrors({});
    }
  }, [isOpen, organization]);

  const validateForm = () => {
    const newErrors: { displayName?: string; description?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (displayName.length < 2) {
      newErrors.displayName = "Display name must be at least 2 characters";
    } else if (displayName.length > 100) {
      newErrors.displayName = "Display name must be less than 100 characters";
    }

    if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        displayName: displayName.trim(),
        description: description.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit organization"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Display name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 size={16} className="text-text-muted" />
            </div>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={[
                "w-full pl-9 pr-3 py-2",
                "bg-bg-surface border rounded-lg",
                "text-text-primary text-sm",
                "placeholder:text-text-muted/60",
                "focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand",
                "transition-colors",
                errors.displayName
                  ? "border-error focus:ring-error/20 focus:border-error"
                  : "border-border hover:border-border/80",
              ].join(" ")}
              placeholder="e.g., Acme Corporation"
              autoComplete="off"
            />
          </div>
          {errors.displayName ? (
            <p className="mt-1.5 text-xs text-error">{errors.displayName}</p>
          ) : (
            <p className="mt-1.5 text-xs text-text-muted">
              This is how your organization will be displayed to members
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Description
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText size={16} className="text-text-muted" />
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={[
                "w-full pl-9 pr-3 py-2",
                "bg-bg-surface border rounded-lg",
                "text-text-primary text-sm",
                "placeholder:text-text-muted/60",
                "focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand",
                "transition-colors resize-none",
                errors.description
                  ? "border-error focus:ring-error/20 focus:border-error"
                  : "border-border hover:border-border/80",
              ].join(" ")}
              placeholder="Tell us about your organization..."
              autoComplete="off"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {errors.description ? (
              <p className="text-xs text-error">{errors.description}</p>
            ) : (
              <p className="text-xs text-text-muted">
                Brief description of your organization
              </p>
            )}
            <p className="text-xs text-text-muted">{description.length}/500</p>
          </div>
        </div>

        {/* Avatar URL (hidden for now) */}
        <div className="hidden">
          <label htmlFor="avatarUrl" className="block text-sm font-medium mb-1">
            Avatar URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 size={16} className="text-text-muted" />
            </div>
            <input
              type="url"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-bg-surface border border-border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
              placeholder="https://example.com/avatar.png"
              autoComplete="off"
            />
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            Avatar URL is not yet supported (coming soon)
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
