/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AppProvider } from "@/context/AppContext";
import EditRepositoryModal from "./EditRepositoryModal";
import { MemoryRouter } from "react-router-dom";
import type { Repository } from "@/services/repositories/repositories.api";
import { useEditRepository } from "@/services/repositories/useEditRepository/useEditRepository";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/Modals/Modal", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockUpdate = vi.fn();
vi.mock("@/services/repositories/useEditRepository/useEditRepository");
const mockedUseEditRepository = vi.mocked(useEditRepository);

const MOCK_REPO: Repository = {
  id: 1,
  name: "nginx",
  fullName: "john.doe/nginx",
  description: "Official Nginx image",
  visibility: "public",
  ownerEmail: "john.doe@example.com",
  createdAt: "2025-01-01T12:00:00Z",
  updatedAt: "2025-03-10T12:00:00Z",
  isOfficial: true,
  starCount: 42,
  tags: ["latest"],
};

const renderModal = (props = {}) =>
  render(
    <MemoryRouter>
      <AppProvider>
        <EditRepositoryModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          repo={MOCK_REPO}
          {...props}
        />
      </AppProvider>
    </MemoryRouter>,
  );

describe("EditRepositoryModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prikazuje error poruku iz hook-a", () => {
    mockedUseEditRepository.mockReturnValue({
      saving: false,
      error: "Update failed",
      update: mockUpdate,
    });

    renderModal();
    expect(screen.getByText("Update failed")).toBeInTheDocument();
  });

  it("menja description i visibility i submituje formu", async () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    mockUpdate.mockResolvedValue(true);
    mockedUseEditRepository.mockReturnValue({
      saving: false,
      error: "",
      update: mockUpdate,
    });

    renderModal({ onSave: handleSave, onClose: handleClose });

    const descInput = screen.getByPlaceholderText(
      "Short description of your image...",
    );
    const privateBtn = screen.getByRole("button", { name: /private/i });
    const saveBtn = screen.getByRole("button", { name: /save changes/i });

    await user.clear(descInput);
    await user.type(descInput, "Updated description");
    await user.click(privateBtn);
    await user.click(saveBtn);

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 1,
      name: "nginx",
      description: "Updated description",
      visibility: "private",
    });

    expect(handleSave).toHaveBeenCalledWith({
      id: 1,
      description: "Updated description",
      visibility: "private",
    });
    expect(handleClose).toHaveBeenCalled();
  });
});
