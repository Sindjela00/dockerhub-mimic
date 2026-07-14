import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatBadge } from "./StatBadge";

describe("StatBadge", () => {
  it("renders the value", () => {
    render(<StatBadge icon={null} value="42" label="stars" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the label", () => {
    render(<StatBadge icon={null} value="42" label="stars" />);
    expect(screen.getByText("stars")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(
      <StatBadge icon={<svg data-testid="icon" />} value="10" label="tags" />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders without icon when icon is null", () => {
    const { container } = render(
      <StatBadge icon={null} value="0" label="forks" />,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("value has primary text styling", () => {
    render(<StatBadge icon={null} value="99" label="views" />);
    const value = screen.getByText("99");
    expect(value.tagName).toBe("SPAN");
    expect(value.className).toContain("text-text-primary");
  });

  it("renders with empty string value", () => {
    render(<StatBadge icon={null} value="" label="items" />);
    expect(screen.getByText("items")).toBeInTheDocument();
  });

  it("renders with empty string label", () => {
    render(<StatBadge icon={null} value="5" label="" />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
