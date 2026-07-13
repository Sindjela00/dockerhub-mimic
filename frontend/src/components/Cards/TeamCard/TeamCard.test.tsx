import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import React from "react";
import { TeamCard } from "./TeamCard";
import userEvent from "@testing-library/user-event";

// --- mocks ---

vi.mock("@/components/Avatar/Avatar", () => ({
  Avatar: ({ initials }: { initials: React.ReactNode }) => (
    <div data-testid="avatar">{initials}</div>
  ),
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
    className?: string;
  }) => (
    <button onClick={onClick} className={className} data-testid="remove-btn">
      {children}
    </button>
  ),
}));

vi.mock("@/components/Modals/DeleteConfirmModal/DeleteConfirmModal", () => ({
  default: ({
    isOpen,
    onClose,
    onDelete,
    title,
    loading,
    error,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    title: string;
    loading?: boolean;
    error?: string | null;
  }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <span>{title}</span>
        {error && <span data-testid="modal-error">{error}</span>}
        <button
          onClick={onDelete}
          disabled={loading}
          data-testid="confirm-delete"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <button onClick={onClose} data-testid="modal-close">
          Cancel
        </button>
      </div>
    ) : null,
}));

vi.mock("@/utils/accentStyle", () => ({
  getAccent: (cls: string) => ({ bg: `bg-${cls}`, text: `text-${cls}` }),
}));

vi.mock("lucide-react", () => ({
  Users: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="users-icon" data-size={size} className={className} />
  ),
  Trash2: ({ size }: { size?: number }) => (
    <svg data-testid="trash-icon" data-size={size} />
  ),
}));

// --- fixtures ---

const baseProps = {
  id: "team-1",
  name: "frontend",
  memberCount: 5,
  accentClass: "brand",
};

// --- tests ---

describe("TeamCard", () => {
  describe("rendering", () => {
    it("renders the team name", () => {
      render(<TeamCard {...baseProps} />);
      expect(screen.getByText("frontend")).toBeInTheDocument();
    });

    it("renders the member count", () => {
      render(<TeamCard {...baseProps} />);
      expect(screen.getByText(/5 members/)).toBeInTheDocument();
    });

    it("renders the Avatar", () => {
      render(<TeamCard {...baseProps} />);
      expect(screen.getByTestId("avatar")).toBeInTheDocument();
    });

    it("does not render the actions area when no onPermissionChange or onRemove", () => {
      render(<TeamCard {...baseProps} />);
      expect(screen.queryByTestId("remove-btn")).not.toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  describe("onClick", () => {
    it("calls onClick with the team id when the card is clicked", async () => {
      const handleClick = vi.fn();
      render(<TeamCard {...baseProps} onClick={handleClick} />);
      await userEvent.click(screen.getByText("frontend"));
      expect(handleClick).toHaveBeenCalledWith("team-1");
    });

    it("does not throw when onClick is not provided", async () => {
      render(<TeamCard {...baseProps} />);
      await userEvent.click(screen.getByText("frontend"));
    });
  });

  describe("permission select", () => {
    it("renders the select when permission and onPermissionChange are provided", () => {
      render(
        <TeamCard
          {...baseProps}
          permission="read-only"
          onPermissionChange={vi.fn()}
        />,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("select has the correct initial value", () => {
      render(
        <TeamCard
          {...baseProps}
          permission="read+write"
          onPermissionChange={vi.fn()}
        />,
      );
      expect(screen.getByRole("combobox")).toHaveValue("read+write");
    });

    it("renders all three permission options", () => {
      render(
        <TeamCard
          {...baseProps}
          permission="read-only"
          onPermissionChange={vi.fn()}
        />,
      );
      const select = screen.getByRole("combobox");
      const options = within(select).getAllByRole("option");
      expect(options.map((o) => o.textContent)).toEqual([
        "Read",
        "Write",
        "Admin",
      ]);
    });

    it("calls onPermissionChange with teamId and new value on change", async () => {
      const handleChange = vi.fn();
      render(
        <TeamCard
          {...baseProps}
          permission="read-only"
          onPermissionChange={handleChange}
        />,
      );
      await userEvent.selectOptions(screen.getByRole("combobox"), "admin");
      expect(handleChange).toHaveBeenCalledWith("team-1", "admin");
    });

    it("does not render the select when permission is undefined", () => {
      render(<TeamCard {...baseProps} onPermissionChange={vi.fn()} />);
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("does not propagate click events to the card onClick", async () => {
      const cardClick = vi.fn();
      render(
        <TeamCard
          {...baseProps}
          permission="read-only"
          onPermissionChange={vi.fn()}
          onClick={cardClick}
        />,
      );
      await userEvent.selectOptions(screen.getByRole("combobox"), "admin");
      expect(cardClick).not.toHaveBeenCalled();
    });
  });

  describe("remove / delete flow", () => {
    it("renders the remove button when onRemove is provided", () => {
      render(<TeamCard {...baseProps} onRemove={vi.fn()} />);
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });

    it("does not render the remove button when onRemove is absent", () => {
      render(<TeamCard {...baseProps} />);
      expect(screen.queryByTestId("remove-btn")).not.toBeInTheDocument();
    });

    it("opens the confirm modal when the remove button is clicked", async () => {
      render(<TeamCard {...baseProps} onRemove={vi.fn()} />);
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
      await userEvent.click(screen.getByTestId("remove-btn"));
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });

    it("remove button click does not propagate to the card onClick", async () => {
      const cardClick = vi.fn();
      render(
        <TeamCard {...baseProps} onRemove={vi.fn()} onClick={cardClick} />,
      );
      await userEvent.click(screen.getByTestId("remove-btn"));
      expect(cardClick).not.toHaveBeenCalled();
    });

    it("closes the modal when cancel is clicked", async () => {
      render(<TeamCard {...baseProps} onRemove={vi.fn()} />);
      await userEvent.click(screen.getByTestId("remove-btn"));
      await userEvent.click(screen.getByTestId("modal-close"));
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });

    it("calls onRemove and closes the modal on successful delete", async () => {
      const onRemove = vi.fn().mockResolvedValue(undefined);
      render(<TeamCard {...baseProps} onRemove={onRemove} />);
      await userEvent.click(screen.getByTestId("remove-btn"));
      await userEvent.click(screen.getByTestId("confirm-delete"));
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
    });

    it("shows an error message when onRemove rejects", async () => {
      const onRemove = vi.fn().mockRejectedValue(new Error("network error"));
      render(<TeamCard {...baseProps} onRemove={onRemove} />);
      await userEvent.click(screen.getByTestId("remove-btn"));
      await userEvent.click(screen.getByTestId("confirm-delete"));
      expect(
        await screen.findByText("Failed to remove team from repository."),
      ).toBeInTheDocument();
    });

    it("clears the error when the modal is closed after a failure", async () => {
      const onRemove = vi.fn().mockRejectedValue(new Error("oops"));
      render(<TeamCard {...baseProps} onRemove={onRemove} />);
      await userEvent.click(screen.getByTestId("remove-btn"));
      await userEvent.click(screen.getByTestId("confirm-delete"));
      await screen.findByTestId("modal-error");
      await userEvent.click(screen.getByTestId("modal-close"));
      // re-open — error should be gone
      await userEvent.click(screen.getByTestId("remove-btn"));
      expect(screen.queryByTestId("modal-error")).not.toBeInTheDocument();
    });
  });
});
