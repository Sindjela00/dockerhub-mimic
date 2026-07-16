import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import OrganizationIconPicker from "./OrganizationIconPicker";

vi.mock("lucide-react", () => ({
  ImagePlus: () => null,
}));

function renderPicker(props: Partial<React.ComponentProps<typeof OrganizationIconPicker>> = {}) {
  const onChange = props.onChange ?? vi.fn();
  const utils = render(
    <OrganizationIconPicker onChange={onChange} {...props} />,
  );
  return { ...utils, onChange };
}

describe("OrganizationIconPicker", () => {
  describe("mode switching", () => {
    it("defaults to upload mode with a file input", () => {
      const { container } = renderPicker();
      expect(container.querySelector("input[type=file]")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/https:\/\//i)).not.toBeInTheDocument();
    });

    it("switches to URL mode and shows a URL input instead of the file input", () => {
      const { container } = renderPicker();
      fireEvent.click(screen.getByRole("button", { name: /paste url/i }));
      expect(container.querySelector("input[type=file]")).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument();
    });

    it("notifies parent with cleared url when switching back to upload mode", () => {
      const { onChange } = renderPicker();
      fireEvent.click(screen.getByRole("button", { name: /paste url/i }));
      fireEvent.change(screen.getByPlaceholderText(/https:\/\//i), {
        target: { value: "https://example.com/icon.png" },
      });
      onChange.mockClear();

      fireEvent.click(screen.getByRole("button", { name: /upload file/i }));
      expect(onChange).toHaveBeenCalledWith({ file: null, url: undefined });
    });
  });

  describe("file upload", () => {
    it("calls onChange with the selected valid file", () => {
      const { container, onChange } = renderPicker();
      const file = new File(["icon"], "icon.png", { type: "image/png" });
      const input = container.querySelector(
        "input[type=file]",
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(onChange).toHaveBeenCalledWith({ file, url: undefined });
    });

    it("rejects a disallowed file type without calling onChange", () => {
      const { container, onChange } = renderPicker();
      const badFile = new File(["x"], "doc.pdf", { type: "application/pdf" });
      const input = container.querySelector(
        "input[type=file]",
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [badFile] } });

      expect(
        screen.getByText(/must be a png, jpeg, gif, or webp image/i),
      ).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("rejects an oversized file without calling onChange", () => {
      const { container, onChange } = renderPicker();
      const bigFile = new File(["x"], "big.png", { type: "image/png" });
      Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 });
      const input = container.querySelector(
        "input[type=file]",
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [bigFile] } });

      expect(screen.getByText(/must not exceed 5 mb/i)).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("url input", () => {
    it("calls onChange with the trimmed url when valid", () => {
      const { onChange } = renderPicker();
      fireEvent.click(screen.getByRole("button", { name: /paste url/i }));

      fireEvent.change(screen.getByPlaceholderText(/https:\/\//i), {
        target: { value: "  https://example.com/icon.png  " },
      });

      expect(onChange).toHaveBeenCalledWith({
        file: null,
        url: "https://example.com/icon.png",
      });
    });

    it("shows an error and does not call onChange for a non-http(s) url", () => {
      const { onChange } = renderPicker();
      fireEvent.click(screen.getByRole("button", { name: /paste url/i }));
      onChange.mockClear();

      fireEvent.change(screen.getByPlaceholderText(/https:\/\//i), {
        target: { value: "ftp://example.com/icon.png" },
      });

      expect(
        screen.getByText(/must start with http:\/\/ or https:\/\//i),
      ).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("treats a cleared url as undefined", () => {
      const { onChange } = renderPicker();
      fireEvent.click(screen.getByRole("button", { name: /paste url/i }));

      fireEvent.change(screen.getByPlaceholderText(/https:\/\//i), {
        target: { value: "" },
      });

      expect(onChange).toHaveBeenCalledWith({ file: null, url: undefined });
    });
  });

  describe("preview", () => {
    it("falls back to currentAvatarUrl when nothing new is chosen", () => {
      const { container } = renderPicker({
        currentAvatarUrl: "https://example.com/current.png",
      });
      const img = container.querySelector("img") as HTMLImageElement;
      expect(img.src).toBe("https://example.com/current.png");
    });
  });
});
