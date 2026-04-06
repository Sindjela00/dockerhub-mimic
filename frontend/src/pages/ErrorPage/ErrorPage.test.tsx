import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import ErrorPage from "./ErrorPage";

describe("ErrorPage", () => {
  it("renders default title and message", () => {
    render(<ErrorPage />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred. Please try again."),
    ).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(<ErrorPage title="Not found" message="This page does not exist." />);
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByText("This page does not exist.")).toBeInTheDocument();
  });

  it("renders Go back button when onBack is provided", () => {
    const onBack = vi.fn();
    render(<ErrorPage onBack={onBack} />);
    expect(screen.getByText("Go back")).toBeInTheDocument();
  });

  it("renders Try again button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorPage onRetry={onRetry} />);
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("does not render action buttons when neither onBack nor onRetry is provided", () => {
    render(<ErrorPage />);
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });

  it("calls onBack when Go back is clicked", () => {
    const onBack = vi.fn();
    render(<ErrorPage onBack={onBack} />);
    fireEvent.click(screen.getByText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry when Try again is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorPage onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders both buttons when both handlers are provided", () => {
    render(<ErrorPage onBack={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText("Go back")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });
});
