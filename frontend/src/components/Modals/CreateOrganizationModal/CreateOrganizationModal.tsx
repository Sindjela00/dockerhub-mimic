import { Building2 } from "lucide-react";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Modal from "../Modal";
import { useAuth } from "@/context/AppContext";
import { useOrganizations } from "@/services/organizations/useOrganizations/useOrganizations";
import { useState } from "react";

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  displayName: string;
  description: string;
}

interface FormErrors {
  name?: string;
  displayName?: string;
  description?: string;
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
}: AddOrganizationModalProps) {
  const { token } = useAuth();
  const { addOrganization, creating } = useOrganizations(token ?? "");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    displayName: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    } else if (!/^[a-z0-9_\-]+$/.test(formData.name)) {
      newErrors.name =
        "Only lowercase letters, numbers, underscores, and hyphens allowed";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (formData.name.length > 255) {
      newErrors.name = "Name must be less than 255 characters";
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.length > 100) {
      newErrors.displayName = "Display name must be less than 100 characters";
    }

    if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const result = await addOrganization({
      name: formData.name.trim(),
      displayName: formData.displayName.trim(),
      description: formData.description.trim(),
    });

    if (result.success) {
      // Reset form
      setFormData({
        name: "",
        displayName: "",
        description: "",
      });
      setErrors({});

      onSuccess?.();
      onClose();
    }
  };

  const handleClose = () => {
    if (creating) return; // Prevent closing while creating
    setFormData({
      name: "",
      displayName: "",
      description: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create new organization"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="text-xs text-text-muted">
          Organizations allow you to manage teams, repositories, and access
          control.
        </div>

        <InputField
          label="Organization name *"
          value={formData.name}
          onChangeRaw={(e) => handleChange("name", e.target.value)}
          placeholder="my-organization"
          error={errors.name}
          startIcon={<Building2 size={14} />}
        />

        <InputField
          label="Display name *"
          value={formData.displayName}
          onChangeRaw={(e) => handleChange("displayName", e.target.value)}
          placeholder="My Organization"
          error={errors.displayName}
        />

        <InputField
          label="Description"
          value={formData.description}
          onChangeRaw={(e) => handleChange("description", e.target.value)}
          placeholder="Brief description of your organization..."
          error={errors.description}
        />

        <div className="flex gap-3 pt-4 border-t border-border justify-end">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={creating}
            type="submit"
          >
            {creating ? "Creating..." : "Create organization"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
