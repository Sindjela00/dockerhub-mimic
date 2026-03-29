import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Pagination from "./Pagination";
import userEvent from "@testing-library/user-event";

describe("Pagination", () => {
  it("prikazuje elipsu kad ima više stranica nego maxVisible", () => {
    render(
      <Pagination
        page={4}
        total={100}
        pageSize={10}
        onChange={vi.fn()}
        maxVisible={5}
      />,
    );
    expect(screen.getByText("…")).toBeInTheDocument();
  });

  it("Prev dugme je onemogućeno na prvoj stranici", () => {
    render(<Pagination page={1} total={50} pageSize={10} onChange={vi.fn()} />);
    const prev = screen.getByRole("button", { name: /previous page/i });
    expect(prev).toBeDisabled();
  });

  it("Next dugme je onemogućeno na poslednjoj stranici", () => {
    render(<Pagination page={5} total={50} pageSize={10} onChange={vi.fn()} />);
    const next = screen.getByRole("button", { name: /next page/i });
    expect(next).toBeDisabled();
  });

  it("Prev dugme poziva onChange sa prethodnom stranicom", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination page={3} total={50} pageSize={10} onChange={handleChange} />,
    );
    await user.click(screen.getByRole("button", { name: /previous page/i }));

    expect(handleChange).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it("Next dugme poziva onChange sa sledećom stranicom", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination page={3} total={50} pageSize={10} onChange={handleChange} />,
    );
    await user.click(screen.getByRole("button", { name: /next page/i }));

    expect(handleChange).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenCalledWith(4);
  });
});
