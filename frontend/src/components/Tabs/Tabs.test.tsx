import Tabs, { TabItem } from "./Tabs";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Clock } from "lucide-react";

describe("Tabs component", () => {
  const tabs: TabItem[] = [
    { value: "tab1", label: "Tab 1" },
    { value: "tab2", label: "Tab 2", badge: 5 },
    { value: "tab3", label: "Tab 3", icon: <Clock size={14} /> },
  ];

  it("renders all tabs", () => {
    render(<Tabs tabs={tabs} active="tab1" onChange={vi.fn()} />);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // badge
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("applies active styles to the selected tab", () => {
    render(<Tabs tabs={tabs} active="tab2" onChange={vi.fn()} />);

    const tab2Btn = screen.getByText("Tab 2").closest("button");
    const tab1Btn = screen.getByText("Tab 1").closest("button");

    expect(tab2Btn?.className).toContain("border-brand");
    expect(tab1Btn?.className).not.toContain("border-brand");
  });

  it("calls onChange when a tab is clicked", () => {
    const onChange = vi.fn();

    render(<Tabs tabs={tabs} active="tab1" onChange={onChange} />);

    const tab2Btn = screen.getByText("Tab 2").closest("button");
    expect(tab2Btn).toBeInTheDocument();

    fireEvent.click(tab2Btn!);
    expect(onChange).toHaveBeenCalledWith("tab2");
  });

  it("renders icons if provided", () => {
    render(<Tabs tabs={tabs} active="tab1" onChange={vi.fn()} />);

    expect(screen.getByText("Tab 3").previousSibling).toBeInTheDocument();
  });

  it("renders badges correctly", () => {
    render(<Tabs tabs={tabs} active="tab1" onChange={vi.fn()} />);

    const badge = screen.getByText("5");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-[10px]");
  });
});
