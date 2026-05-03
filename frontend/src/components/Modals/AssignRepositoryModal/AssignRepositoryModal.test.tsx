import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import AssignRepositoryModal from "./AssignRepositoryModal";
import React from "react";
import userEvent from "@testing-library/user-event";

// --- mocks ---

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
        {children}
      </div>
    ) : null,
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
      data-testid={variant === "ghost" ? "cancel-btn" : "assign-btn"}
    >
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => <svg data-testid="loader" />,
}));

const mockAddRepository = vi.fn();

vi.mock(
  "@/services/organizations/useTeamRepositories/useTeamRepositories",
  () => ({
    useTeamRepositories: () => ({ addRepository: mockAddRepository }),
  }),
);

const mockFetchOrganizationTeams = vi.fn();
vi.mock("@/services/organizations/organizations.api", () => ({
  fetchOrganizationTeams: (...args: unknown[]) =>
    mockFetchOrganizationTeams(...args),
}));

vi.mock("@/context/AppContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("./types/types", () => ({
  PERMISSIONS: [
    { label: "Read", key: "read-only" },
    { label: "Write", key: "read+write" },
    { label: "Admin", key: "admin" },
  ],
}));

// --- fixtures ---

const teams = [
  { id: 1, name: "frontend" },
  { id: 2, name: "backend" },
  { id: 3, name: "devops" },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  orgName: "acme",
  repoId: 42,
  assignedTeams: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchOrganizationTeams.mockResolvedValue({ teams });
  mockAddRepository.mockResolvedValue(undefined);
});

// --- helpers ---

const renderOpen = (props = {}) =>
  render(<AssignRepositoryModal {...defaultProps} {...props} />);

// --- tests ---

describe("AssignRepositoryModal", () => {
  describe("visibility", () => {
    it("renders nothing when isOpen is false", () => {
      renderOpen({ isOpen: false });
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("renders the modal with the correct title", async () => {
      renderOpen();
      expect(
        await screen.findByText("Assign Repository to Team"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows a loading indicator while teams are being fetched", () => {
      // keep the promise pending
      mockFetchOrganizationTeams.mockReturnValue(new Promise(() => {}));
      renderOpen();
      expect(screen.getByText("Loading teams…")).toBeInTheDocument();
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    it("hides the loading indicator after teams load", async () => {
      renderOpen();
      await waitFor(() =>
        expect(screen.queryByText("Loading teams…")).not.toBeInTheDocument(),
      );
    });
  });

  describe("error state", () => {
    it("shows the error message when fetchOrganizationTeams rejects", async () => {
      mockFetchOrganizationTeams.mockRejectedValue(
        new Error("Network failure"),
      );
      renderOpen();
      expect(await screen.findByText("Network failure")).toBeInTheDocument();
    });

    it("uses a fallback error message when the error has no message", async () => {
      mockFetchOrganizationTeams.mockRejectedValue({});
      renderOpen();
      expect(
        await screen.findByText("Failed to load teams"),
      ).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows the empty state when all teams are already assigned", async () => {
      // assignedTeams covers every fetched team
      const assignedTeams = teams.map((t) => ({
        teamId: t.id,
        teamName: t.name,
      }));
      mockFetchOrganizationTeams.mockResolvedValue({ teams });
      renderOpen({ assignedTeams });
      expect(
        await screen.findByText("No teams available to assign."),
      ).toBeInTheDocument();
    });

    it("shows the empty state when the org has no teams at all", async () => {
      mockFetchOrganizationTeams.mockResolvedValue({ teams: [] });
      renderOpen();
      expect(
        await screen.findByText("No teams available to assign."),
      ).toBeInTheDocument();
    });
  });

  describe("team list", () => {
    it("renders all unassigned teams in the select", async () => {
      renderOpen();
      await screen.findByText("frontend");
      const select = screen.getAllByRole("combobox")[0];
      const options = Array.from(select.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(options).toEqual(["frontend", "backend", "devops"]);
    });

    it("excludes teams that are already assigned", async () => {
      const assignedTeams = [{ teamId: 1, teamName: "frontend" }];
      renderOpen({ assignedTeams });
      await screen.findByText("backend");
      const select = screen.getAllByRole("combobox")[0];
      const options = Array.from(select.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(options).not.toContain("frontend");
      expect(options).toContain("backend");
      expect(options).toContain("devops");
    });

    it("pre-selects the first available team", async () => {
      renderOpen();
      await waitFor(() =>
        expect(screen.getAllByRole("combobox")[0]).toHaveValue("frontend"),
      );
    });

    it("calls fetchOrganizationTeams with orgName and token", async () => {
      renderOpen();
      await waitFor(() =>
        expect(mockFetchOrganizationTeams).toHaveBeenCalledWith(
          "acme",
          "test-token",
        ),
      );
    });
  });

  describe("permission select", () => {
    it("renders all permission options", async () => {
      renderOpen();
      await screen.findByText("frontend");
      const permSelect = screen.getAllByRole("combobox")[1];
      const options = Array.from(permSelect.querySelectorAll("option")).map(
        (o) => o.textContent,
      );
      expect(options).toEqual(["Read", "Write", "Admin"]);
    });

    it("defaults to read-only", async () => {
      renderOpen();
      await screen.findByText("frontend");
      expect(screen.getAllByRole("combobox")[1]).toHaveValue("read-only");
    });

    it("updates the selected permission", async () => {
      renderOpen();
      await screen.findByText("frontend");
      await userEvent.selectOptions(
        screen.getAllByRole("combobox")[1],
        "admin",
      );
      expect(screen.getAllByRole("combobox")[1]).toHaveValue("admin");
    });
  });

  describe("form submission", () => {
    it("calls addRepository with repoId and selected permission", async () => {
      renderOpen();
      await screen.findByText("frontend");
      await userEvent.click(screen.getByTestId("assign-btn"));
      expect(mockAddRepository).toHaveBeenCalledWith({
        repositoryId: 42,
        permission: "read-only",
      });
    });

    it("passes the updated permission to addRepository", async () => {
      renderOpen();
      await screen.findByText("frontend");
      await userEvent.selectOptions(
        screen.getAllByRole("combobox")[1],
        "read+write",
      );
      await userEvent.click(screen.getByTestId("assign-btn"));
      expect(mockAddRepository).toHaveBeenCalledWith({
        repositoryId: 42,
        permission: "read+write",
      });
    });

    it("calls onClose after a successful assign", async () => {
      const onClose = vi.fn();
      renderOpen({ onClose });
      await screen.findByText("frontend");
      await userEvent.click(screen.getByTestId("assign-btn"));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it("disables the assign button while submitting", async () => {
      let resolve: () => void;
      mockAddRepository.mockReturnValue(
        new Promise<void>((res) => {
          resolve = res;
        }),
      );
      renderOpen();
      await screen.findByText("frontend");
      await userEvent.click(screen.getByTestId("assign-btn"));
      expect(screen.getByTestId("assign-btn")).toBeDisabled();
      resolve!();
    });

    it("re-enables the assign button after submission completes", async () => {
      renderOpen();
      await screen.findByText("frontend");
      await userEvent.click(screen.getByTestId("assign-btn"));
      await waitFor(() =>
        expect(screen.getByTestId("assign-btn")).not.toBeDisabled(),
      );
    });

    it("does not call addRepository when no team is selected", async () => {
      mockFetchOrganizationTeams.mockResolvedValue({ teams: [] });
      renderOpen();
      await screen.findByText("No teams available to assign.");
      expect(mockAddRepository).not.toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("calls onClose when cancel is clicked", async () => {
      const onClose = vi.fn();
      renderOpen({ onClose });
      await screen.findByText("frontend");
      await userEvent.click(screen.getByTestId("cancel-btn"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("effect re-fetch guard", () => {
    it("does not fetch teams when isOpen is false", () => {
      renderOpen({ isOpen: false });
      expect(mockFetchOrganizationTeams).not.toHaveBeenCalled();
    });

    it("does not fetch teams when orgName is empty", async () => {
      renderOpen({ orgName: "" });
      await waitFor(() =>
        expect(mockFetchOrganizationTeams).not.toHaveBeenCalled(),
      );
    });
  });
});
