import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EditOrganizationModal from "./EditOrganizationModal";

vi.mock("../Modal", () => ({
  default: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button onClick={onClose}>Close modal</button>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({
    children,
    onClick,
    disabled,
    type,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Building2: () => null,
  FileText: () => null,
  Link2: () => null,
}));

const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

const defaultOrganization = {
  displayName: "Acme Corp",
  description: "We build things.",
  avatarUrl: "https://example.com/avatar.png",
};

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  organization: defaultOrganization,
};

function renderModal(props = {}) {
  return render(<EditOrganizationModal {...defaultProps} {...props} />);
}

describe("EditOrganizationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders when isOpen is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit organization")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders display name input pre-filled with organization value", () => {
      renderModal();
      expect(screen.getByLabelText(/display name/i)).toHaveValue("Acme Corp");
    });

    it("renders description textarea pre-filled with organization value", () => {
      renderModal();
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        "We build things.",
      );
    });

    it("renders Cancel and Save changes buttons", () => {
      renderModal();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument();
    });

    it("renders description character counter", () => {
      renderModal();
      expect(
        screen.getByText(`${defaultOrganization.description.length}/500`),
      ).toBeInTheDocument();
    });

    it("does not show validation errors on initial render", () => {
      renderModal();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/must be/i)).not.toBeInTheDocument();
    });
  });

  describe("form reset on open", () => {
    it("resets fields to new organization values when organization prop changes and modal opens", () => {
      const { rerender } = renderModal({ isOpen: false });

      rerender(
        <EditOrganizationModal
          {...defaultProps}
          isOpen={true}
          organization={{
            displayName: "New Corp",
            description: "New desc",
            avatarUrl: "",
          }}
        />,
      );

      expect(screen.getByLabelText(/display name/i)).toHaveValue("New Corp");
      expect(screen.getByLabelText(/description/i)).toHaveValue("New desc");
    });

    it("resets fields when modal reopens after being closed", () => {
      const { rerender } = renderModal();

      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "Modified Name" },
      });

      rerender(<EditOrganizationModal {...defaultProps} isOpen={false} />);
      rerender(<EditOrganizationModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/display name/i)).toHaveValue("Acme Corp");
    });
  });

  describe("validation: displayName", () => {
    it("shows error when display name is empty", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.getByText("Display name is required")).toBeInTheDocument();
    });

    it("shows error when display name is whitespace only", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.getByText("Display name is required")).toBeInTheDocument();
    });

    it("shows error when display name is shorter than 2 characters", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "A" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.getByText("Display name must be at least 2 characters"),
      ).toBeInTheDocument();
    });

    it("shows error when display name exceeds 100 characters", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "A".repeat(101) },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.getByText("Display name must be less than 100 characters"),
      ).toBeInTheDocument();
    });

    it("accepts display name with exactly 2 characters", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "AB" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.queryByText(/display name must be at least/i),
      ).not.toBeInTheDocument();
    });

    it("accepts display name with exactly 100 characters", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "A".repeat(100) },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.queryByText(/display name must be less than/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("validation: description", () => {
    it("shows error when description exceeds 500 characters", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "x".repeat(501) },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.getByText("Description must be less than 500 characters"),
      ).toBeInTheDocument();
    });

    it("accepts description with exactly 500 characters", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "x".repeat(500) },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.queryByText(/description must be less than/i),
      ).not.toBeInTheDocument();
    });

    it("accepts empty description", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        screen.queryByText(/description must be/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("character counter", () => {
    it("updates character counter as user types in description", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "Hello" },
      });
      expect(screen.getByText("5/500")).toBeInTheDocument();
    });

    it("shows 0/500 when description is cleared", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "" },
      });
      expect(screen.getByText("0/500")).toBeInTheDocument();
    });
  });

  describe("submission", () => {
    it("calls onSave with trimmed values on valid submit", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "  Trimmed Corp  " },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "  Some desc  " },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      expect(mockOnSave).toHaveBeenCalledWith({
        displayName: "Trimmed Corp",
        description: "Some desc",
        avatarUrl: defaultOrganization.avatarUrl,
      });
    });

    it("calls onClose after successful save", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("does not call onSave when validation fails", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("does not call onClose when validation fails", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("saves with empty avatarUrl when organization has none", () => {
      renderModal({
        organization: {
          displayName: "Acme",
          description: "desc",
          avatarUrl: undefined,
        },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: "" }),
      );
    });
  });

  describe("cancel and close", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when modal close button is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("does not call onSave when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});
