import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { VisibilityToggle } from "./VisibilityToggle";

describe("VisibilityToggle", () => {
  it("renders both options", () => {
    render(<VisibilityToggle value={"public"} onChange={vi.fn()} />);

    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("highlights selected value", () => {
    render(<VisibilityToggle value={"public"} onChange={vi.fn()} />);

    const publicBtn = screen.getByText("Public").closest("button");
    const privateBtn = screen.getByText("Private").closest("button");

    expect(publicBtn?.className).toContain("border-brand");
    expect(privateBtn?.className).not.toContain("border-brand");
  });

  it("calls onChange when clicking Public", () => {
    const onChange = vi.fn();

    render(<VisibilityToggle value={"private"} onChange={onChange} />);

    fireEvent.click(screen.getByText("Public"));

    expect(onChange).toHaveBeenCalledWith("public");
  });

  it("calls onChange when clicking Private", () => {
    const onChange = vi.fn();

    render(<VisibilityToggle value={"public"} onChange={onChange} />);

    fireEvent.click(screen.getByText("Private"));

    expect(onChange).toHaveBeenCalledWith("private");
  });

  it("shows correct description for public", () => {
    render(<VisibilityToggle value={"public"} onChange={vi.fn()} />);

    expect(screen.getByText("Anyone can pull this image.")).toBeInTheDocument();
  });

  it("shows correct description for private", () => {
    render(<VisibilityToggle value={"private"} onChange={vi.fn()} />);

    expect(
      screen.getByText("Only you and your team can access this image."),
    ).toBeInTheDocument();
  });

  it("renders indicator dots", () => {
    render(<VisibilityToggle value={"public"} onChange={vi.fn()} />);

    const dots = screen
      .getAllByRole("button")
      .map((btn) => btn.querySelector("span"));

    expect(dots.length).toBe(2);
  });
});
