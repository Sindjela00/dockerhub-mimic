import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DeleteConfirmModal from "./DeleteConfirmModal";

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
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => (
    <div>
      <label htmlFor="confirm-input">{label}</label>
      <input
        id="confirm-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  TriangleAlert: () => <svg data-testid="triangle-alert-icon" />,
}));

const mockOnClose = vi.fn();
const mockOnDelete = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onDelete: mockOnDelete,
  title: "Delete repository",
  entityName: "my-repo",
};

function renderModal(props = {}) {
  return render(<DeleteConfirmModal {...defaultProps} {...props} />);
}

function typeConfirm(value: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value } });
}

describe("DeleteConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnDelete.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders when isOpen is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Delete repository")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders the warning icon", () => {
      renderModal();
      expect(screen.getByTestId("triangle-alert-icon")).toBeInTheDocument();
    });

    it("renders the cannot be undone warning", () => {
      renderModal();
      expect(
        screen.getByText("This action cannot be undone."),
      ).toBeInTheDocument();
    });

    it("renders default description with entityName when no description prop provided", () => {
      renderModal();
      expect(
        screen.getByText(/permanently remove all associated data/i),
      ).toBeInTheDocument();
      expect(screen.getByText("my-repo")).toBeInTheDocument();
    });

    it("renders custom description when provided as string", () => {
      renderModal({ description: "This will delete everything forever." });
      expect(
        screen.getByText("This will delete everything forever."),
      ).toBeInTheDocument();
    });

    it("renders custom description when provided as ReactNode", () => {
      renderModal({
        description: <span data-testid="custom-desc">Custom node</span>,
      });
      expect(screen.getByTestId("custom-desc")).toBeInTheDocument();
    });

    it("renders the confirm input with correct label", () => {
      renderModal();
      expect(
        screen.getByLabelText(`Type "my-repo" to confirm`),
      ).toBeInTheDocument();
    });

    it("renders Cancel and Delete buttons", () => {
      renderModal();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete my-repo/i }),
      ).toBeInTheDocument();
    });

    it("does not show error when error prop is null", () => {
      renderModal();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows error when error prop is provided", () => {
      renderModal({ error: "Something went wrong." });
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });

  describe("confirm input", () => {
    it("delete button is disabled when confirm input is empty", () => {
      renderModal();
      expect(
        screen.getByRole("button", { name: /delete my-repo/i }),
      ).toBeDisabled();
    });

    it("delete button is disabled when confirm input does not match entityName", () => {
      renderModal();
      typeConfirm("wrong-name");
      expect(
        screen.getByRole("button", { name: /delete my-repo/i }),
      ).toBeDisabled();
    });

    it("delete button is enabled when confirm input exactly matches entityName", () => {
      renderModal();
      typeConfirm("my-repo");
      expect(
        screen.getByRole("button", { name: /delete my-repo/i }),
      ).not.toBeDisabled();
    });

    it("delete button is disabled when confirm input is a partial match", () => {
      renderModal();
      typeConfirm("my-rep");
      expect(
        screen.getByRole("button", { name: /delete my-repo/i }),
      ).toBeDisabled();
    });

    it("delete button is disabled when confirm input has extra characters", () => {
      renderModal();
      typeConfirm("my-repo!");
      expect(
        screen.getByRole("button", { name: /delete my-repo/i }),
      ).toBeDisabled();
    });
  });

  describe("deletion", () => {
    it("calls onDelete when confirmed and button clicked", async () => {
      renderModal();
      typeConfirm("my-repo");
      fireEvent.click(screen.getByRole("button", { name: /delete my-repo/i }));
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
      });
    });

    it("does not call onDelete when confirm does not match", () => {
      renderModal();
      typeConfirm("wrong");
      fireEvent.click(screen.getByRole("button", { name: /delete my-repo/i }));
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it("resets confirm input after successful deletion", async () => {
      renderModal();
      typeConfirm("my-repo");
      fireEvent.click(screen.getByRole("button", { name: /delete my-repo/i }));
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalled();
      });
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  describe("loading state", () => {
    it("shows Deleting... label when loading is true", () => {
      renderModal({ loading: true });
      expect(
        screen.getByRole("button", { name: /deleting/i }),
      ).toBeInTheDocument();
    });

    it("disables delete button when loading is true", () => {
      renderModal({ loading: true });
      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    });

    it("disables cancel button when loading is true", () => {
      renderModal({ loading: true });
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    });

    it("disables delete button when loading is true even if confirm matches", () => {
      renderModal({ loading: true });
      typeConfirm("my-repo");
      expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
    });
  });

  describe("cancel and close", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("resets confirm input when Cancel is clicked", () => {
      renderModal();
      typeConfirm("my-repo");
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("resets confirm input when modal is closed via the modal's own close button", () => {
      renderModal();
      typeConfirm("my-repo");
      fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(screen.getByRole("textbox")).toHaveValue("");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
