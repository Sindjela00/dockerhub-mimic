import * as adminApi from "../../services/admin/admin.api";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import AdminUsersPage from "./AdminUsersPage";
import { renderWithProviders } from "../../test/test.utils";
import userEvent from "@testing-library/user-event";

const listAdminsSpy = vi.spyOn(adminApi, "listAdmins");
const createAdminSpy = vi.spyOn(adminApi, "createAdmin");

const existingAdmins = [
  {
    id: 1,
    username: "admin1",
    email: "admin1@example.com",
    role: "Administrator",
    createdAt: "2026-01-01T00:00:00Z",
    mustChangePassword: false,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  listAdminsSpy.mockResolvedValue({ data: existingAdmins } as any);
});

describe("AdminUsersPage", () => {
  it("prikazuje listu postojecih administratora", async () => {
    renderWithProviders(<AdminUsersPage />);

    await waitFor(() =>
      expect(screen.getByText("admin1")).toBeInTheDocument(),
    );
    expect(screen.getByText("admin1@example.com")).toBeInTheDocument();
  });

  it("kreira novog administratora i prikazuje privremenu lozinku", async () => {
    createAdminSpy.mockResolvedValueOnce({
      data: {
        message: "Administrator created successfully.",
        username: "newadmin",
        email: "newadmin@example.com",
        temporaryPassword: "Temp1Pass",
      },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<AdminUsersPage />);

    await waitFor(() =>
      expect(screen.getByText("admin1")).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/username/i), "newadmin");
    await user.type(screen.getByLabelText(/email/i), "newadmin@example.com");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(screen.getByText("Temp1Pass")).toBeInTheDocument(),
    );
    expect(createAdminSpy).toHaveBeenCalledWith({
      username: "newadmin",
      email: "newadmin@example.com",
    });
  });

  it("prikazuje gresku kada kreiranje admina ne uspe", async () => {
    createAdminSpy.mockRejectedValueOnce({
      response: { data: { message: "User with this email already exists." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<AdminUsersPage />);

    await waitFor(() =>
      expect(screen.getByText("admin1")).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText(/username/i), "dupeadmin");
    await user.type(screen.getByLabelText(/email/i), "admin1@example.com");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/user with this email already exists/i),
      ).toBeInTheDocument(),
    );
  });
});
