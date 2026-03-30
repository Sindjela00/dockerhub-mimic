import * as hook from "@/services/repositories/useDeleteRepository/useDeleteRepository";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DeleteRepositoryModal from "./DeleteRepositoryModal";

// mock hook
vi.mock(
  "@/services/repositories/useDeleteRepository/useDeleteRepository",
  () => ({
    useDeleteRepository: vi.fn(),
  }),
);

const mockedUseDeleteRepository =
  hook.useDeleteRepository as unknown as ReturnType<typeof vi.fn>;

const MOCK_REPO = {
  id: "1",
  fullName: "marija/test-repo",
};

describe("DeleteRepositoryModal", () => {
  const onClose = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseDeleteRepository.mockReturnValue({
      loading: false,
      error: "",
      handleDelete: vi.fn().mockResolvedValue(true),
    });
  });

  it("renders modal content", () => {
    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /delete repository/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone/i),
    ).toBeInTheDocument();
    expect(screen.getByText("marija/test-repo")).toBeInTheDocument();
  });

  it("disables delete button if not confirmed", () => {
    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    const deleteBtn = screen.getByRole("button", {
      name: /delete repository/i,
    });

    expect(deleteBtn).toBeDisabled();
  });

  it("enables delete button when input matches repo name", () => {
    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    const input = screen.getByPlaceholderText("marija/test-repo");
    fireEvent.change(input, { target: { value: "marija/test-repo" } });

    const deleteBtn = screen.getByRole("button", {
      name: /delete repository/i,
    });

    expect(deleteBtn).not.toBeDisabled();
  });

  it("calls delete flow on confirm", async () => {
    const handleDelete = vi.fn().mockResolvedValue(true);

    mockedUseDeleteRepository.mockReturnValue({
      loading: false,
      error: "",
      handleDelete,
    });

    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    const input = screen.getByPlaceholderText("marija/test-repo");
    fireEvent.change(input, { target: { value: "marija/test-repo" } });

    const deleteBtn = screen.getByRole("button", {
      name: /delete repository/i,
    });

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith("1");
    });

    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call delete if not confirmed", async () => {
    const handleDelete = vi.fn();

    mockedUseDeleteRepository.mockReturnValue({
      loading: false,
      error: "",
      handleDelete,
    });

    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    const deleteBtn = screen.getByRole("button", {
      name: /delete repository/i,
    });

    fireEvent.click(deleteBtn);

    expect(handleDelete).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    mockedUseDeleteRepository.mockReturnValue({
      loading: true,
      error: "",
      handleDelete: vi.fn(),
    });

    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
  });

  it("shows error message", () => {
    mockedUseDeleteRepository.mockReturnValue({
      loading: false,
      error: "Delete failed",
      handleDelete: vi.fn(),
    });

    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    expect(screen.getByText("Delete failed")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(
      <DeleteRepositoryModal
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
        repo={MOCK_REPO as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
