import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import InputField from "./InputField";
import userEvent from "@testing-library/user-event";

vi.mock("lucide-react", () => ({
  Search: () => <span data-testid="mock-search" />,
  Eye: () => <span data-testid="mock-eye" />,
  EyeOff: () => <span data-testid="mock-eyeoff" />,
}));

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

  it("poziva onChange i onChangeRaw kad korisnik kuca", async () => {
    const handleChange = vi.fn();
    const handleChangeRaw = vi.fn();
    const user = userEvent.setup();

    render(
      <InputField
        label="Email"
        value=""
        onChange={handleChange}
        onChangeRaw={handleChangeRaw}
      />,
    );

    const input = screen.getByLabelText(/email/i);
    await user.type(input, "a");

    expect(handleChange).toHaveBeenCalledWith("a");
    expect(handleChangeRaw).toHaveBeenCalled();
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

  it("prikazuje error poruku i border klasu", () => {
    render(
      <InputField
        label="Email"
        value=""
        onChange={vi.fn()}
        error="Neispravan email."
      />,
    );

    expect(screen.getByText("Neispravan email.")).toBeTruthy();
    const wrapper = screen.getByLabelText(/email/i).closest("div");
    expect(wrapper?.className).toContain("border-danger");
  });

  it("ne prikazuje error kad nema greške", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    expect(screen.queryByText(/./, { selector: "p" })).toBeNull();
    const wrapper = screen.getByLabelText(/email/i).closest("div");
    expect(wrapper?.className).toContain("border-border");
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

  it("prikazuje startIcon i endIcon ako su prosleđeni", () => {
    render(
      <InputField
        label="Email"
        value=""
        onChange={vi.fn()}
        startIcon={<span data-testid="start">S</span>}
        endIcon={<span data-testid="end">E</span>}
      />,
    );
    expect(screen.getByTestId("start")).toBeTruthy();
    expect(screen.getByTestId("end")).toBeTruthy();
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

  it("sakriva labelu kad nije prosleđena", () => {
    render(<InputField value="" onChange={vi.fn()} />);
    const label = screen.queryByLabelText(/./);
    expect(label).toBeNull();
  });
});
