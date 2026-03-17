import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import InputField from "./InputField";
import userEvent from "@testing-library/user-event";

describe("InputField", () => {
  it("renderuje label i input", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("label je povezan sa inputom preko htmlFor", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText(/email/i);
    expect(input.id).toBe("email");
  });

  it("generiše id iz labele sa razmakom", () => {
    render(<InputField label="Old password" value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText(/old password/i);
    expect(input.id).toBe("old-password");
  });

  it("koristi custom id ako je prosleđen", () => {
    render(
      <InputField label="Email" id="custom-id" value="" onChange={vi.fn()} />,
    );
    const input = screen.getByLabelText(/email/i);
    expect(input.id).toBe("custom-id");
  });

  it("poziva onChange kad korisnik kuca", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<InputField label="Email" value="" onChange={handleChange} />);
    await user.type(screen.getByLabelText(/email/i), "a");

    expect(handleChange).toHaveBeenCalledWith("a");
  });

  it("prikazuje placeholder", () => {
    render(
      <InputField
        label="Email"
        value=""
        onChange={vi.fn()}
        placeholder="you@example.com"
      />,
    );
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
  });

  it("prikazuje error poruku", () => {
    render(
      <InputField
        label="Email"
        value=""
        onChange={vi.fn()}
        error="Neispravan email."
      />,
    );
    expect(screen.getByText("Neispravan email.")).toBeTruthy();
  });

  it("ne prikazuje error kad nema greške", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("paragraph")).toBeNull();
  });

  it("primenjuje error border klasu na wrapper kad ima grešku", () => {
    render(
      <InputField label="Email" value="" onChange={vi.fn()} error="Greška" />,
    );
    const wrapper = screen.getByLabelText(/email/i).closest("div");
    expect(wrapper?.className).toContain("border-danger");
  });

  it("primenjuje default border klasu na wrapper bez greške", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    const wrapper = screen.getByLabelText(/email/i).closest("div");
    expect(wrapper?.className).toContain("border-border");
  });

  it("postavlja type atribut", () => {
    render(
      <InputField
        label="Password"
        type="password"
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("prikazuje prefix ispred inputa", () => {
    render(
      <InputField
        label="Repository name"
        value=""
        onChange={vi.fn()}
        prefix="fakeUsername/"
      />,
    );
    expect(screen.getByText("fakeUsername/")).toBeTruthy();
  });

  it("ne prikazuje prefix kad nije prosleđen", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    expect(screen.queryByText(/\//)).toBeNull();
  });
});
