import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import InviteMemberModal from "./InviteMembersModal";

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
      aria-label="Email"
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
  return render(<InviteMemberModal {...defaultProps} {...props} />);
}

describe("InviteMemberModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("does not render when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders the email input", () => {
      renderModal();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders admin and member role buttons", () => {
      renderModal();
      expect(screen.getByRole("button", { name: "admin" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "member" }),
      ).toBeInTheDocument();
    });

    it("defaults to member role selected", () => {
      renderModal();
      expect(screen.getByRole("button", { name: "member" })).toHaveClass(
        "border-brand",
      );
      expect(screen.getByRole("button", { name: "admin" })).not.toHaveClass(
        "border-brand",
      );
    });

    it("renders Cancel and Invite member buttons", () => {
      renderModal();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /invite member/i }),
      ).toBeInTheDocument();
    });

    it("does not show error on initial render", () => {
      renderModal();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });

  describe("role selection", () => {
    it("selects admin role when admin button is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: "admin" }));
      expect(screen.getByRole("button", { name: "admin" })).toHaveClass(
        "border-brand",
      );
      expect(screen.getByRole("button", { name: "member" })).not.toHaveClass(
        "border-brand",
      );
    });

    it("switches back to member role when member button is clicked after selecting admin", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: "admin" }));
      fireEvent.click(screen.getByRole("button", { name: "member" }));
      expect(screen.getByRole("button", { name: "member" })).toHaveClass(
        "border-brand",
      );
      expect(screen.getByRole("button", { name: "admin" })).not.toHaveClass(
        "border-brand",
      );
    });
  });

  describe("validation", () => {
    it("shows error when email is empty on submit", async () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    });

    it("shows error when email is whitespace only", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    });

    it("does not call onSave when validation fails", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls onSave with trimmed email and selected role", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "  john@example.com  " },
      });
      fireEvent.click(screen.getByRole("button", { name: "admin" }));
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          email: "john@example.com",
          role: "admin",
        });
      });
    });

    it("calls onSave with default member role when role is not changed", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "jane@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          email: "jane@example.com",
          role: "member",
        });
      });
    });

    it("calls onClose and resets form after successful invite", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "jane@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(screen.getByLabelText("Email")).toHaveValue("");
    });

    it("resets role to member after successful invite", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "jane@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "admin" }));
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

      await waitFor(() => expect(mockOnClose).toHaveBeenCalled());

      // re-open
      render(<InviteMemberModal {...defaultProps} />);
      expect(screen.getAllByRole("button", { name: "member" })[0]).toHaveClass(
        "border-brand",
      );
    });

    it("shows error when onSave rejects", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Network error"));
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "john@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

      expect(
        await screen.findByText("Failed to invite member. Please try again."),
      ).toBeInTheDocument();
    });

    it("does not call onClose when onSave rejects", async () => {
      mockOnSave.mockRejectedValueOnce(new Error("Network error"));
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "john@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

      await screen.findByText("Failed to invite member. Please try again.");
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("shows Inviting... label while submitting", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {}));
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "john@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      expect(
        await screen.findByRole("button", { name: /inviting/i }),
      ).toBeInTheDocument();
    });

    it("disables both buttons while submitting", async () => {
      mockOnSave.mockImplementation(() => new Promise(() => {}));
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "john@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      await screen.findByRole("button", { name: /inviting/i });
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /inviting/i })).toBeDisabled();
    });
  });

  describe("cancel and close", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("resets email input when Cancel is clicked", () => {
      renderModal();
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "john@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.getByLabelText("Email")).toHaveValue("");
    });

    it("resets role to member when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: "admin" }));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.getByRole("button", { name: "member" })).toHaveClass(
        "border-brand",
      );
    });

    it("clears error when Cancel is clicked", async () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /invite member/i }));
      await screen.findByText("Email is required.");
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByText("Email is required.")).not.toBeInTheDocument();
    });

    it("calls onClose when modal close button is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
