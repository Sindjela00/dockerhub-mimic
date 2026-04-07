import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import FavoriteStar from "./FavoriteStar";

describe("FavoriteStar", () => {
  const onToggle = vi.fn();

  beforeEach(() => {
    onToggle.mockClear();
  });

  it("renders 'Star' label when not starred", () => {
    render(<FavoriteStar starred={false} onToggle={onToggle} />);
    expect(screen.getByText("Star")).toBeInTheDocument();
  });

  it("renders 'Starred' label when starred", () => {
    render(<FavoriteStar starred={true} onToggle={onToggle} />);
    expect(screen.getByText("Starred")).toBeInTheDocument();
  });

  it("shows correct title when not starred", () => {
    render(<FavoriteStar starred={false} onToggle={onToggle} />);
    expect(screen.getByTitle("Add to favorites")).toBeInTheDocument();
  });

  it("shows correct title when starred", () => {
    render(<FavoriteStar starred={true} onToggle={onToggle} />);
    expect(screen.getByTitle("Remove from favorites")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    render(<FavoriteStar starred={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByTitle("Add to favorites"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggle when disabled (loading)", () => {
    render(<FavoriteStar starred={false} loading={true} onToggle={onToggle} />);
    const button = screen.getByTitle("Add to favorites");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("renders count when provided", () => {
    render(<FavoriteStar starred={false} count={42} onToggle={onToggle} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("does not render count when not provided", () => {
    render(<FavoriteStar starred={false} onToggle={onToggle} />);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("renders count 0", () => {
    render(<FavoriteStar starred={false} count={0} onToggle={onToggle} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
