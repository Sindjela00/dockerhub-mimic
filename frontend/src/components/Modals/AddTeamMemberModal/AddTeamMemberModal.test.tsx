import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import AddTeamMemberModal from "./AddTeamMemberModal";
import React from "react";
import userEvent from "@testing-library/user-event";

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
      <div data-testid="modal">
        <h1>{title}</h1>
        <button data-testid="modal-backdrop-close" onClick={onClose} />
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/Avatar/Avatar", () => ({
  Avatar: ({ initials }: { initials: string }) => (
    <div data-testid="avatar">{initials}</div>
  ),
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({
    children,
    onClick,
    disabled,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-testid={variant === "primary" ? "submit-btn" : "cancel-btn"}
    >
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
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="search-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tag">{children}</span>
  ),
}));

vi.mock("@/utils/getInitials", () => ({
  getInitials: (name: string) => name.slice(0, 2).toUpperCase(),
}));

vi.mock("lucide-react", () => ({
  Search: () => <svg data-testid="search-icon" />,
}));

const members = [
  { userId: 1, username: "alice", email: "alice@example.com", role: "owner" },
  { userId: 2, username: "bob", email: "bob@example.com", role: "admin" },
  { userId: 3, username: "carol", email: "carol@example.com", role: "member" },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  availableMembers: members,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AddTeamMemberModal", () => {
  describe("rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<AddTeamMemberModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("renders the modal with the correct title when open", () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      expect(screen.getByText("Add member to team")).toBeInTheDocument();
    });

    it("renders all available members", () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("carol")).toBeInTheDocument();
    });

    it("renders email addresses for each member", () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });

    it("renders role tags for each member", () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      const tags = screen.getAllByTestId("tag");
      const tagTexts = tags.map((t) => t.textContent);
      expect(tagTexts).toContain("owner");
      expect(tagTexts).toContain("admin");
      expect(tagTexts).toContain("member");
    });

    it("renders the empty state when no members are available", () => {
      render(<AddTeamMemberModal {...defaultProps} availableMembers={[]} />);
      expect(screen.getByText("No members available.")).toBeInTheDocument();
    });

    it("the submit button is disabled initially (no selection)", () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });
  });

  describe("search / filtering", () => {
    it("filters members by username", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      await userEvent.type(screen.getByTestId("search-input"), "ali");
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.queryByText("bob")).not.toBeInTheDocument();
    });

    it("filters members by email", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      await userEvent.type(screen.getByTestId("search-input"), "bob@");
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.queryByText("alice")).not.toBeInTheDocument();
    });

    it("is case-insensitive", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      await userEvent.type(screen.getByTestId("search-input"), "ALICE");
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    it("shows the empty state when search matches no members", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      await userEvent.type(screen.getByTestId("search-input"), "zzz");
      expect(screen.getByText("No members available.")).toBeInTheDocument();
    });
  });

  describe("member selection", () => {
    it("enables the submit button after selecting a member", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      await userEvent.click(screen.getByText("alice"));
      expect(screen.getByTestId("submit-btn")).not.toBeDisabled();
    });

    it("allows switching selection to another member", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByText("bob"));
      expect(screen.getByTestId("submit-btn")).not.toBeDisabled();
    });
  });

  describe("form submission", () => {
    it("shows a validation error when submitting with no selection", async () => {
      render(<AddTeamMemberModal {...defaultProps} />);
      expect(screen.getByTestId("submit-btn")).toBeDisabled();
      expect(
        screen.queryByText("Please select a member."),
      ).not.toBeInTheDocument();
    });

    it("calls onSave with the selected userId on submit", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<AddTeamMemberModal {...defaultProps} onSave={onSave} />);
      await userEvent.click(screen.getByText("bob"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      expect(onSave).toHaveBeenCalledWith(2);
    });

    it("calls onClose after a successful save", async () => {
      const onClose = vi.fn();
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(
        <AddTeamMemberModal
          {...defaultProps}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("shows loading text while saving", async () => {
      let resolve: () => void;
      const onSave = vi.fn(
        () =>
          new Promise<void>((res) => {
            resolve = res;
          }),
      );
      render(<AddTeamMemberModal {...defaultProps} onSave={onSave} />);
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      expect(screen.getByTestId("submit-btn")).toHaveTextContent("Adding...");
      resolve!();
    });

    it("disables both buttons while loading", async () => {
      let resolve: () => void;
      const onSave = vi.fn(
        () =>
          new Promise<void>((res) => {
            resolve = res;
          }),
      );
      render(<AddTeamMemberModal {...defaultProps} onSave={onSave} />);
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      expect(screen.getByTestId("submit-btn")).toBeDisabled();
      expect(screen.getByTestId("cancel-btn")).toBeDisabled();
      resolve!();
    });

    it("shows an error message when onSave rejects", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("network"));
      render(<AddTeamMemberModal {...defaultProps} onSave={onSave} />);
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      expect(
        await screen.findByText("Failed to add member. Please try again."),
      ).toBeInTheDocument();
    });

    it("does not call onClose when onSave rejects", async () => {
      const onClose = vi.fn();
      const onSave = vi.fn().mockRejectedValue(new Error("network"));
      render(
        <AddTeamMemberModal
          {...defaultProps}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      await screen.findByText("Failed to add member. Please try again.");
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("calls onClose when cancel is clicked", async () => {
      const onClose = vi.fn();
      render(<AddTeamMemberModal {...defaultProps} onClose={onClose} />);
      await userEvent.click(screen.getByTestId("cancel-btn"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("state reset on close", () => {
    it("clears search, selection, and error when modal is closed and reopened", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("oops"));
      const { rerender } = render(
        <AddTeamMemberModal {...defaultProps} onSave={onSave} />,
      );

      await userEvent.type(screen.getByTestId("search-input"), "alice");
      await userEvent.click(screen.getByText("alice"));
      await userEvent.click(screen.getByTestId("submit-btn"));
      await screen.findByText("Failed to add member. Please try again.");

      rerender(
        <AddTeamMemberModal {...defaultProps} onSave={onSave} isOpen={false} />,
      );
      rerender(
        <AddTeamMemberModal {...defaultProps} onSave={onSave} isOpen={true} />,
      );

      expect(screen.getByTestId("search-input")).toHaveValue("");
      expect(
        screen.queryByText("Failed to add member. Please try again."),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });
  });
});
