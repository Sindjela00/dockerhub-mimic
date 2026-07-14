import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import EmptyState from "./EmptyState";
import userEvent from "@testing-library/user-event";

describe("EmptyState", () => {
  it("renderuje naslov i opis", () => {
    render(<EmptyState onCreate={vi.fn()} />);
    expect(screen.getByText("No repositories yet")).toBeTruthy();
    expect(screen.getByText(/create your first repository/i)).toBeTruthy();
  });

  it("renderuje Create repository dugme", () => {
    render(<EmptyState onCreate={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /create repository/i }),
    ).toBeTruthy();
  });

  it("poziva onCreate kad se klikne dugme", async () => {
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    render(<EmptyState onCreate={handleCreate} />);
    await user.click(
      screen.getByRole("button", { name: /create repository/i }),
    );

    expect(handleCreate).toHaveBeenCalledOnce();
  });
});
