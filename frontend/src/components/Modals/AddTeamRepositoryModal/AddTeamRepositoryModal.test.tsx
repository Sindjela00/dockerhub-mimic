import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AddTeamRepositoryModal from "./AddTeamRepositoryModal";
import { Repository } from "@/services/repositories/repositories.api";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick, disabled, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/InputField/InputField", () => ({
  default: ({ value, onChange, placeholder, startIcon }: any) => (
    <div>
      {startIcon}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="search-input"
      />
    </div>
  ),
}));

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children, accentClass }: any) => (
    <span data-accent={accentClass}>{children}</span>
  ),
}));

vi.mock("../Modal", () => ({
  default: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

describe("AddTeamRepositoryModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockRepositories: Repository[] = [
    {
      id: 1,
      name: "frontend-repo",
      description: "Frontend application",
      visibility: "public",
      fullName: "",
      ownerEmail: "",
      createdAt: "",
      updatedAt: "",
      isOfficial: false,
      starCount: 0,
      tags: [],
    },
    {
      id: 2,
      name: "backend-repo",
      description: "Backend API",
      visibility: "private",
      fullName: "",
      ownerEmail: "",
      createdAt: "",
      updatedAt: "",
      isOfficial: false,
      starCount: 0,
      tags: [],
    },
    {
      id: 3,
      name: "database-repo",
      description: "Database migrations",
      visibility: "public",
      fullName: "",
      ownerEmail: "",
      createdAt: "",
      updatedAt: "",
      isOfficial: false,
      starCount: 0,
      tags: [],
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    availableRepositories: mockRepositories,
    alreadyAddedIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    render(<AddTeamRepositoryModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("renders modal when isOpen is true", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Add repository to team")).toBeInTheDocument();
  });

  it("displays search input field", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("displays all available repositories", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    expect(screen.getByText("frontend-repo")).toBeInTheDocument();
    expect(screen.getByText("backend-repo")).toBeInTheDocument();
    expect(screen.getByText("database-repo")).toBeInTheDocument();

    expect(screen.getByText("Frontend application")).toBeInTheDocument();
    expect(screen.getByText("Backend API")).toBeInTheDocument();
  });

  it("filters repositories based on search input", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "frontend");

    expect(screen.getByText("frontend-repo")).toBeInTheDocument();
    expect(screen.queryByText("backend-repo")).not.toBeInTheDocument();
    expect(screen.queryByText("database-repo")).not.toBeInTheDocument();
  });

  it("shows 'No repositories available' when filtered list is empty", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "nonexistent");

    expect(screen.getByText("No repositories available.")).toBeInTheDocument();
  });

  it("filters out already added repositories", () => {
    render(
      <AddTeamRepositoryModal {...defaultProps} alreadyAddedIds={[1, 2]} />,
    );

    expect(screen.queryByText("frontend-repo")).not.toBeInTheDocument();
    expect(screen.queryByText("backend-repo")).not.toBeInTheDocument();
    expect(screen.getByText("database-repo")).toBeInTheDocument();
  });

  it("allows selecting a repository", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    expect(repoButton).toBeInTheDocument();

    await userEvent.click(repoButton!);

    expect(repoButton).toHaveClass("border-brand");
  });

  it("displays permission options", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    expect(screen.getByText("read")).toBeInTheDocument();
    expect(screen.getByText("write")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("allows changing permission", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const writeButton = screen.getByText("write");
    await userEvent.click(writeButton);

    expect(writeButton).toHaveClass("border-brand");
  });

  it("defaults to read-only permission", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const readButton = screen.getByText("read");
    expect(readButton).toHaveClass("border-brand");
  });

  it("disables submit button when no repository is selected", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const submitButton = screen.getByText("Add repository");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when repository is selected", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const submitButton = screen.getByText("Add repository");
    expect(submitButton).not.toBeDisabled();
  });

  it("calls onSave with correct parameters when repository is selected", async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const writeButton = screen.getByText("write");
    await userEvent.click(writeButton);

    const submitButton = screen.getByText("Add repository");
    await userEvent.click(submitButton);

    expect(mockOnSave).toHaveBeenCalledWith(1, "read+write");
  });

  it("shows loading state while saving", async () => {
    mockOnSave.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const submitButton = screen.getByText("Add repository");
    await userEvent.click(submitButton);

    expect(screen.getByText("Adding...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText("Adding...")).not.toBeInTheDocument();
    });
  });

  it("calls onClose after successful save", async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const submitButton = screen.getByText("Add repository");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error message when onSave fails", async () => {
    mockOnSave.mockRejectedValueOnce(new Error("API Error"));

    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const submitButton = screen.getByText("Add repository");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to add repository. Please try again."),
      ).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("cancels and closes modal when cancel button is clicked", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("closes modal via modal close button", async () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const modalCloseButton = screen.getByTestId("modal-close");
    await userEvent.click(modalCloseButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("resets state when modal closes and reopens", async () => {
    const { rerender } = render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const writeButton = screen.getByText("write");
    await userEvent.click(writeButton);

    rerender(<AddTeamRepositoryModal {...defaultProps} isOpen={false} />);

    rerender(<AddTeamRepositoryModal {...defaultProps} isOpen={true} />);

    const searchInput = screen.getByTestId("search-input");
    expect(searchInput).toHaveValue("");

    const readButton = screen.getByText("read");
    expect(readButton).toHaveClass("border-brand");

    const submitButton = screen.getByText("Add repository");
    expect(submitButton).toBeDisabled();
  });

  it("displays visibility tag for each repository", () => {
    render(<AddTeamRepositoryModal {...defaultProps} />);

    const publicTags = screen.getAllByText("public");
    const privateTags = screen.getAllByText("private");

    expect(publicTags).toHaveLength(2);
    expect(privateTags).toHaveLength(1);
  });

  it("disables buttons during loading", async () => {
    mockOnSave.mockImplementationOnce(() => new Promise(() => {}));

    render(<AddTeamRepositoryModal {...defaultProps} />);

    const repoButton = screen.getByText("frontend-repo").closest("button");
    await userEvent.click(repoButton!);

    const submitButton = screen.getByText("Add repository");
    await userEvent.click(submitButton);

    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
