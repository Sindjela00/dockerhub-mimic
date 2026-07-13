import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CreateTeamModal from "./CreateTeamModal";

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

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
};

function renderModal(props = {}) {
  return render(<CreateTeamModal {...defaultProps} {...props} />);
}

describe("CreateTeamModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders when isOpen is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create new team")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders team name input and description textarea", () => {
      renderModal();
      expect(screen.getByLabelText("Team name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("What does this team work on?"),
      ).toBeInTheDocument();
    });

    it("renders Cancel and Create team buttons", () => {
      renderModal();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create team/i }),
      ).toBeInTheDocument();
    });

    it("does not show an error on initial render", () => {
      renderModal();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows error when submitting with empty name", async () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      expect(
        await screen.findByText("Team name is required."),
      ).toBeInTheDocument();
    });

    it("shows error when submitting with whitespace-only name", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      expect(
        await screen.findByText("Team name is required."),
      ).toBeInTheDocument();
    });

    it("does not call onSave when validation fails", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls onSave with trimmed name and description", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "  frontend  " },
      });
      fireEvent.change(
        screen.getByPlaceholderText("What does this team work on?"),
        {
          target: { value: "  UI work  " },
        },
      );
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "frontend",
          description: "UI work",
        });
      });
    });

    it("calls onSave with empty description when not filled", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "devops",
          description: "",
        });
      });
    });

    it("calls onClose and resets form after successful save", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(screen.getByLabelText("Team name")).toHaveValue("");
    });

    it("shows error message when onSave rejects", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Server error"));
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      expect(
        await screen.findByText("Failed to create team. Please try again."),
      ).toBeInTheDocument();
    });

    it("does not call onClose when onSave rejects", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Server error"));
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      await screen.findByText("Failed to create team. Please try again.");
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("shows Creating... label while submitting", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {}));
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      expect(
        await screen.findByRole("button", { name: /creating/i }),
      ).toBeInTheDocument();
    });

    it("disables both buttons while submitting", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {}));
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      await screen.findByRole("button", { name: /creating/i });
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    });
  });

  describe("cancel and close", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("resets name and description when Cancel is clicked", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Team name"), {
        target: { value: "devops" },
      });
      fireEvent.change(
        screen.getByPlaceholderText("What does this team work on?"),
        {
          target: { value: "infra stuff" },
        },
      );
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.getByLabelText("Team name")).toHaveValue("");
      expect(
        screen.getByPlaceholderText("What does this team work on?"),
      ).toHaveValue("");
    });

    it("clears error when Cancel is clicked", async () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /create team/i }));
      await screen.findByText("Team name is required.");
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(
        screen.queryByText("Team name is required."),
      ).not.toBeInTheDocument();
    });
  });
});
