import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Button from "./Button";
import userEvent from "@testing-library/user-event";

describe("Button", () => {
  it("renderuje decu", () => {
    render(<Button>Klikni me</Button>);
    expect(screen.getByRole("button", { name: /klikni me/i })).toBeTruthy();
  });

  it("poziva onClick kad se klikne", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Klikni</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("ne poziva onClick kad je disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Klikni
      </Button>,
    );
    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("ima disabled atribut kad je disabled", () => {
    render(<Button disabled>Klikni</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("primenjuje primary varijantu", () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[var(--color-brand)]");
  });

  it("primenjuje ghost varijantu po defaultu", () => {
    render(<Button>Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("hover:bg-[var(--color-bg-elevated)]");
  });

  it("primenjuje danger varijantu", () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-[var(--color-danger)]");
  });

  it("primenjuje sm velicinu", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-xs");
  });

  it("primenjuje md velicinu po defaultu", () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-sm");
  });

  it("prosledjuje dodatne className", () => {
    render(<Button className="w-full">Button</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("w-full");
  });

  it("prosledjuje type atribut", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
