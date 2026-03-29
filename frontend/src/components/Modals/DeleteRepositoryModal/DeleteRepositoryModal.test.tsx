/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import InputField from "@/components/InputField/InputField";
import userEvent from "@testing-library/user-event";

vi.mock("lucide-react", () => ({
  Search: () => <span data-testid="mock-search" />,
  Eye: () => <span data-testid="mock-eye" />,
  EyeOff: () => <span data-testid="mock-eyeoff" />,
}));

describe("InputField", () => {
  it("renderuje label i input", () => {
    render(<InputField label="Email" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("label je povezana sa inputom preko htmlFor/id", () => {
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
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
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
    expect(screen.getByText("Neispravan email.")).toBeInTheDocument();
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
      <InputField label="Repo" value="" onChange={vi.fn()} prefix="user/" />,
    );
    expect(screen.getByText("user/")).toBeInTheDocument();
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
    expect(screen.getByTestId("start")).toBeInTheDocument();
    expect(screen.getByTestId("end")).toBeInTheDocument();
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
