import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Avatar } from "./Avatar";
import React from "react";

describe("Avatar", () => {
  describe("rendering", () => {
    it("renders string initials", () => {
      render(<Avatar initials="AB" />);
      expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("renders a ReactNode as initials", () => {
      render(<Avatar initials={<span data-testid="icon">★</span>} />);
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("applies md size classes by default", () => {
      render(<Avatar initials="AB" />);
      const el = screen.getByText("AB");
      expect(el.className).toMatch(/w-9/);
      expect(el.className).toMatch(/h-9/);
      expect(el.className).toMatch(/text-xs/);
    });

    it("applies sm size classes", () => {
      render(<Avatar initials="AB" size="sm" />);
      const el = screen.getByText("AB");
      expect(el.className).toMatch(/w-7/);
      expect(el.className).toMatch(/h-7/);
      expect(el.className).toMatch(/text-\[11px\]/);
    });

    it("applies lg size classes", () => {
      render(<Avatar initials="AB" size="lg" />);
      const el = screen.getByText("AB");
      expect(el.className).toMatch(/w-11/);
      expect(el.className).toMatch(/h-11/);
      expect(el.className).toMatch(/text-sm/);
    });
  });

  describe("rounded prop", () => {
    it("applies rounded-full by default", () => {
      render(<Avatar initials="AB" />);
      expect(screen.getByText("AB").className).toMatch(/rounded-full/);
    });

    it("applies rounded-md when specified", () => {
      render(<Avatar initials="AB" rounded="rounded-md" />);
      expect(screen.getByText("AB").className).toMatch(/rounded-md/);
    });
  });

  describe("static classes", () => {
    it("always renders with base layout and style classes", () => {
      render(<Avatar initials="AB" />);
      const el = screen.getByText("AB");
      expect(el.className).toMatch(/min-w-fit/);
      expect(el.className).toMatch(/flex/);
      expect(el.className).toMatch(/items-center/);
      expect(el.className).toMatch(/justify-center/);
      expect(el.className).toMatch(/font-mono/);
    });
  });
});
