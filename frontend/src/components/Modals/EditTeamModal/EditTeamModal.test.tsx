import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EditTeamModal from "./EditTeamModal";

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

vi.mock("@/components/InputField/InputField", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => (
    <input
      aria-label="Team name"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

const mockOnClose = vi.fn();
const mockOnSave = vi.fn();

const defaultInitialValues = {
  name: "frontend",
  description: "Handles the UI",
};

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  initialValues: defaultInitialValues,
};

function renderModal(props = {}) {
  return render(<EditTeamModal {...defaultProps} {...props} />);
}

describe("EditTeamModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders when isOpen is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Edit team")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("pre-fills name input with initialValues", () => {
      renderModal();
      expect(screen.getByLabelText("Team name")).toHaveValue("frontend");
    });

    it("pre-fills description textarea with initialValues", () => {
      renderModal();
      expect(
        screen.getByPlaceholderText("What does this team work on?"),
      ).toHaveValue("Handles the UI");
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

    it("does not show error on initial render", () => {
      renderModal();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });

  describe("form reset on open", () => {
    it("resets fields to initialValues when modal reopens", () => {
      const { rerender } = renderModal();

      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "modified" },
      });

      rerender(<EditTeamModal {...defaultProps} isOpen={false} />);
      rerender(<EditTeamModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText("Team name")).toHaveValue("frontend");
    });

    it("resets fields when initialValues change and modal opens", () => {
      const { rerender } = renderModal({ isOpen: false });

      rerender(
        <EditTeamModal
          {...defaultProps}
          isOpen={true}
          initialValues={{ name: "devops", description: "Infra team" }}
        />,
      );

      expect(screen.getByLabelText("Team name")).toHaveValue("devops");
      expect(
        screen.getByPlaceholderText("What does this team work on?"),
      ).toHaveValue("Infra team");
    });
  });

  describe("validation", () => {
    it("shows error when name is empty on submit", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.getByText("Team name is required.")).toBeInTheDocument();
    });

    it("shows error when name is whitespace only", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.getByText("Team name is required.")).toBeInTheDocument();
    });

    it("does not call onSave when validation fails", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls onSave with trimmed name and description", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "  backend  " },
      });
      fireEvent.change(
        screen.getByPlaceholderText("What does this team work on?"),
        {
          target: { value: "  API work  " },
        },
      );
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "backend",
          description: "API work",
        });
      });
    });

    it("calls onSave with empty description when not filled", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.change(
        screen.getByPlaceholderText("What does this team work on?"),
        {
          target: { value: "" },
        },
      );
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "devops",
          description: "",
        });
      });
    });

    it("calls onClose after successful save", async () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("shows error when onSave rejects", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Server error"));
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByText("Failed to update team. Please try again."),
      ).toBeInTheDocument();
    });

    it("does not call onClose when onSave rejects", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Server error"));
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      await screen.findByText("Failed to update team. Please try again.");
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("shows Saving... label while submitting", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {}));
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(
        await screen.findByRole("button", { name: /saving/i }),
      ).toBeInTheDocument();
    });

    it("disables both buttons while submitting", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {}));
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      await screen.findByRole("button", { name: /saving/i });
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });
  });

  describe("cancel and close", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("resets name and description to initialValues when Cancel is clicked", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "changed" },
      });
      fireEvent.change(
        screen.getByPlaceholderText("What does this team work on?"),
        {
          target: { value: "changed desc" },
        },
      );
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.getByLabelText("Team name")).toHaveValue("frontend");
      expect(
        screen.getByPlaceholderText("What does this team work on?"),
      ).toHaveValue("Handles the UI");
    });

    it("clears error when Cancel is clicked", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "" },
      });
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
      expect(screen.getByText("Team name is required.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(
        screen.queryByText("Team name is required."),
      ).not.toBeInTheDocument();
    });

    it("calls onClose when modal close button is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
