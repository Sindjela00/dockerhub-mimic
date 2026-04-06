import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Modal from "./Modal";
import userEvent from "@testing-library/user-event";

const renderModal = (props = {}) =>
  render(
    <Modal isOpen={true} onClose={vi.fn()} title="Test modal" {...props}>
      <p>Modal content</p>
    </Modal>,
  );

describe("Modal", () => {
  it("renderuje sadrzaj kad je otvoren", () => {
    renderModal();
    expect(screen.getByText("Test modal")).toBeTruthy();
    expect(screen.getByText("Modal content")).toBeTruthy();
  });

  it("ne renderuje nista kad je zatvoren", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test modal">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.queryByText("Test modal")).toBeNull();
    expect(screen.queryByText("Modal content")).toBeNull();
  });

  it("poziva onClose kad se klikne X dugme", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });
    await user.click(screen.getByLabelText("Close modal"));

    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("poziva onClose kad se klikne overlay", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });
    await user.click(document.querySelector(".absolute.inset-0")!);

    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("poziva onClose na Escape", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderModal({ onClose: handleClose });
    await user.keyboard("{Escape}");

    expect(handleClose).toHaveBeenCalledOnce();
  });
});
