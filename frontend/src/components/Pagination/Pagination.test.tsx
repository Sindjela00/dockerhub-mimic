import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import Pagination from "@/components/Pagination/Pagination";

describe("Pagination", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  it("renders nothing when totalPages is 1", () => {
    const { container } = render(
      <Pagination page={1} total={10} pageSize={10} onChange={onChange} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when total is 0", () => {
    const { container } = render(
      <Pagination page={1} total={0} pageSize={10} onChange={onChange} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page buttons when there are multiple pages", () => {
    render(
      <Pagination page={1} total={30} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 3")).toBeInTheDocument();
  });

  it("marks the current page with aria-current=page", () => {
    render(
      <Pagination page={2} total={30} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByLabelText("Page 2")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByLabelText("Page 1")).not.toHaveAttribute("aria-current");
  });

  it("shows correct info text on first page", () => {
    render(
      <Pagination page={1} total={25} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByText("1–10")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows correct info text on last page", () => {
    render(
      <Pagination page={3} total={25} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByText("21–25")).toBeInTheDocument();
  });

  it("shows correct info text on middle page", () => {
    render(
      <Pagination page={2} total={25} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByText("11–20")).toBeInTheDocument();
  });

  it("disables prev button on first page", () => {
    render(
      <Pagination page={1} total={30} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <Pagination page={3} total={30} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("enables both prev and next on middle page", () => {
    render(
      <Pagination page={2} total={30} pageSize={10} onChange={onChange} />,
    );
    expect(screen.getByLabelText("Previous page")).not.toBeDisabled();
    expect(screen.getByLabelText("Next page")).not.toBeDisabled();
  });

  it("calls onChange with page - 1 when prev is clicked", () => {
    render(
      <Pagination page={3} total={30} pageSize={10} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with page + 1 when next is clicked", () => {
    render(
      <Pagination page={1} total={30} pageSize={10} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not call onChange when prev is clicked on first page", () => {
    render(
      <Pagination page={1} total={30} pageSize={10} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when next is clicked on last page", () => {
    render(
      <Pagination page={3} total={30} pageSize={10} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with correct page number when page button clicked", () => {
    render(
      <Pagination page={1} total={30} pageSize={10} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText("Page 3"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("shows ellipsis when pages exceed maxVisible", () => {
    render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onChange={onChange}
        maxVisible={5}
      />,
    );
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });

  it("always shows first and last page when ellipsis is present", () => {
    render(
      <Pagination
        page={5}
        total={100}
        pageSize={10}
        onChange={onChange}
        maxVisible={5}
      />,
    );
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 10")).toBeInTheDocument();
  });

  it("does not show ellipsis when total pages fit within maxVisible", () => {
    render(
      <Pagination
        page={1}
        total={40}
        pageSize={10}
        onChange={onChange}
        maxVisible={5}
      />,
    );
    expect(screen.queryByText("…")).not.toBeInTheDocument();
  });

  it("shows two ellipses when current page is in the middle of many pages", () => {
    render(
      <Pagination
        page={5}
        total={100}
        pageSize={10}
        onChange={onChange}
        maxVisible={3}
      />,
    );
    expect(screen.getAllByText("…")).toHaveLength(2);
  });
});
