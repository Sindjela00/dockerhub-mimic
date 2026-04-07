import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { Owner } from "../../types/types";
import { OwnerSelect } from "./OwnerSelect";

const MOCK_OWNERS: Owner[] = [
  { value: "1", label: "Marija", type: "user" },
  { value: "2", label: "Company", type: "org" },
];

describe("OwnerSelect", () => {
  it("renders selected owner", () => {
    render(<OwnerSelect value="1" owners={MOCK_OWNERS} onChange={vi.fn()} />);

    expect(screen.getByText("Marija")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("falls back to first owner if value not found", () => {
    render(<OwnerSelect value="999" owners={MOCK_OWNERS} onChange={vi.fn()} />);

    expect(screen.getByText("Marija")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<OwnerSelect value="1" owners={MOCK_OWNERS} onChange={vi.fn()} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText("Company")).toBeInTheDocument();
  });

  it("closes dropdown when clicking again", () => {
    render(<OwnerSelect value="1" owners={MOCK_OWNERS} onChange={vi.fn()} />);

    const button = screen.getByRole("button");

    fireEvent.click(button); // open
    fireEvent.click(button); // close

    expect(screen.queryByText("Company")).not.toBeInTheDocument();
  });

  it("calls onChange and closes dropdown when selecting owner", () => {
    const onChange = vi.fn();

    render(<OwnerSelect value="1" owners={MOCK_OWNERS} onChange={onChange} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    const option = screen.getByText("Company");
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("2");
    expect(screen.queryByText("Company")).not.toBeInTheDocument();
  });

  it("renders correct type labels", () => {
    render(<OwnerSelect value="2" owners={MOCK_OWNERS} onChange={vi.fn()} />);

    expect(screen.getByText("Organization")).toBeInTheDocument();
  });

  it("renders initials correctly", () => {
    render(<OwnerSelect value="1" owners={MOCK_OWNERS} onChange={vi.fn()} />);

    expect(screen.getByText("M")).toBeInTheDocument();
  });
});
