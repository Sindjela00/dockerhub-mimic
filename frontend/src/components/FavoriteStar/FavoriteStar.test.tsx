/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import FavoriteStar from "./FavoriteStar";
import userEvent from "@testing-library/user-event";

describe("FavoriteStar", () => {
  it("renderuje default stanje bez count-a", () => {
    render(<FavoriteStar />);
    expect(screen.getByText("Star")).toBeInTheDocument();
    expect(screen.queryByText("Starred")).toBeNull();
  });

  it("prikazuje count ako je prosleđen", () => {
    render(<FavoriteStar count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("menja tekst i class kada se klikne", async () => {
    const user = userEvent.setup();
    render(<FavoriteStar />);

    const button = screen.getByRole("button");

    expect(button).toHaveTextContent("Star");

    await user.click(button);

    expect(button).toHaveTextContent("Starred");
    expect(button).toHaveAttribute("title", "Remove from favorites");
  });

  it("poziva onToggle sa ispravnom vrednošću", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<FavoriteStar onToggle={onToggle} />);

    const button = screen.getByRole("button");

    await user.click(button);
    expect(onToggle).toHaveBeenCalledWith(true);

    await user.click(button);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("count se inkrementira ako se staruje prvi put", async () => {
    const user = userEvent.setup();
    render(<FavoriteStar count={3} initialStarred={false} />);

    const count = screen.getByText("3");
    const button = screen.getByRole("button");

    expect(count.textContent).toBe("3");

    await user.click(button);

    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("count ne menja vrednost ako je initialStarred=true", async () => {
    const user = userEvent.setup();
    render(<FavoriteStar count={5} initialStarred={true} />);

    const button = screen.getByRole("button");
    expect(screen.getByText("5")).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
