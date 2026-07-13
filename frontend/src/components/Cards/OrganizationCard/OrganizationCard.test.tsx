import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import OrganizationCard from "./OrganizationCard";
import React from "react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/Tag/Tag", () => ({
  TagComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tag">{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  Users: () => <svg data-testid="users-icon" />,
}));

vi.mock("@/utils/getInitials", () => ({
  getInitials: (name: string) => name.slice(0, 2).toUpperCase(),
}));

const baseOrg = {
  name: "acme-corp",
  displayName: "Acme Corp",
  description: "We make everything.",
};

const orgWithoutDescription = { ...baseOrg, description: "" };

describe("OrganizationCard", () => {
  describe("rendering – org info", () => {
    it("renders the displayName", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    it("renders the org name (slug)", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByText("acme-corp")).toBeInTheDocument();
    });

    it("renders initials derived from displayName", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByText("AC")).toBeInTheDocument();
    });

    it("falls back to name for initials when displayName is empty", () => {
      render(<OrganizationCard org={{ ...baseOrg, displayName: "" }} />);
      expect(screen.getByText("AC")).toBeInTheDocument();
    });

    it("renders the Org tag", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByTestId("tag")).toBeInTheDocument();
      expect(screen.getByTestId("users-icon")).toBeInTheDocument();
    });
  });

  describe("rendering – description", () => {
    it("renders the description when provided", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByText("We make everything.")).toBeInTheDocument();
    });

    it("renders the fallback when description is empty", () => {
      render(<OrganizationCard org={orgWithoutDescription} />);
      expect(screen.getByText("No description provided.")).toBeInTheDocument();
    });

    it("does not render the fallback when description is present", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(
        screen.queryByText("No description provided."),
      ).not.toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onClick when the card is clicked", async () => {
      const handleClick = vi.fn();
      render(<OrganizationCard org={baseOrg} onClick={handleClick} />);
      await userEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not throw when onClick is not provided", async () => {
      render(<OrganizationCard org={baseOrg} />);
      await userEvent.click(screen.getByRole("button"));
    });
  });

  describe("accessibility", () => {
    it("renders as a button element", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("button has text-left alignment class", () => {
      render(<OrganizationCard org={baseOrg} />);
      expect(screen.getByRole("button").className).toMatch(/text-left/);
    });
  });
});
