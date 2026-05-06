import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import RepoCard from "./RepoCard";
import type { Repository } from "@/services/repositories/repositories.api";
import userEvent from "@testing-library/user-event";

vi.mock("@/context/AppContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/repositories/useStarRepository/useStarRepository", () => ({
  useStarRepository: vi.fn(),
}));

vi.mock("@/utils/formatDate", () => ({
  formatDate: vi.fn((date: string) => "Jan 1, 2024"),
}));

const mockToggle = vi.fn();
const mockOnClick = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

const createMockRepo = (overrides: Partial<Repository> = {}): Repository => ({
  id: "1",
  name: "TestRepo",
  fullName: "user/TestRepo",
  description: "A test repository",
  visibility: "public",
  updatedAt: "2024-01-01T00:00:00Z",
  tags: ["react", "typescript", "testing"],
  starCount: 42,
  isStarredByCurrentUser: false,
  isOfficial: false,
  ...overrides,
});

describe("RepoCard", async () => {
  const { useAuth } = vi.mocked(await import("@/context/AppContext"));
  const { useStarRepository } = vi.mocked(
    await import("@/services/repositories/useStarRepository/useStarRepository"),
  );
  const { formatDate } = vi.mocked(await import("@/utils/formatDate"));

  const defaultStarReturn = {
    starred: false,
    count: 42,
    loading: false,
    toggle: mockToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ role: "User" } as any);
    useStarRepository.mockReturnValue(defaultStarReturn);
  });

  describe("Rendering", () => {
    it("renders repository name and full name", () => {
      render(<RepoCard repo={createMockRepo()} />);

      expect(screen.getByText("user/TestRepo")).toBeInTheDocument();
      expect(screen.getByText("TE")).toBeInTheDocument(); // First two letters
    });

    it("renders description when provided", () => {
      render(
        <RepoCard repo={createMockRepo({ description: "My awesome repo" })} />,
      );

      expect(screen.getByText("My awesome repo")).toBeInTheDocument();
    });

    it("does not render description when null or empty", () => {
      render(<RepoCard repo={createMockRepo({ description: "" })} />);

      expect(screen.queryByText("A test repository")).not.toBeInTheDocument();
    });

    it("renders formatted update date", () => {
      render(<RepoCard repo={createMockRepo()} />);

      expect(formatDate).toHaveBeenCalledWith("2024-01-01T00:00:00Z");
      expect(screen.getByText("Updated Jan 1, 2024")).toBeInTheDocument();
    });

    it("renders visibility badge for public repos", () => {
      render(<RepoCard repo={createMockRepo({ visibility: "public" })} />);

      expect(screen.getByText("public")).toBeInTheDocument();
    });

    it("renders visibility badge for private repos", () => {
      render(<RepoCard repo={createMockRepo({ visibility: "private" })} />);

      expect(screen.getByText("private")).toBeInTheDocument();
    });

    it("renders official badge when repo is official", () => {
      render(<RepoCard repo={createMockRepo({ isOfficial: true })} />);

      expect(screen.getByText("Official")).toBeInTheDocument();
    });

    it("does not render official badge when repo is not official", () => {
      render(<RepoCard repo={createMockRepo({ isOfficial: false })} />);

      expect(screen.queryByText("Official")).not.toBeInTheDocument();
    });
  });

  describe("Tags", () => {
    it("renders tags when present", () => {
      render(
        <RepoCard repo={createMockRepo({ tags: ["react", "typescript"] })} />,
      );

      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
    });

    it("renders maximum 3 tags", () => {
      render(
        <RepoCard
          repo={createMockRepo({
            tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
          })}
        />,
      );

      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
      expect(screen.getByText("tag3")).toBeInTheDocument();
      expect(screen.queryByText("tag4")).not.toBeInTheDocument();

      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it('shows "no tags" message when tags array is empty', () => {
      render(<RepoCard repo={createMockRepo({ tags: [] })} />);

      expect(screen.getByText("There are no tags")).toBeInTheDocument();
    });
  });

  describe("Star functionality", () => {
    it("toggles star when star button is clicked", async () => {
      const user = userEvent.setup();
      render(<RepoCard repo={createMockRepo()} />);

      const starButton = screen.getByTitle("Star");
      await user.click(starButton);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("shows filled star when repo is starred", () => {
      useStarRepository.mockReturnValue({
        starred: true,
        count: 42,
        loading: false,
        toggle: mockToggle,
      });

      render(
        <RepoCard repo={createMockRepo({ isStarredByCurrentUser: true })} />,
      );

      const starButton = screen.getByTitle("Unstar");
      expect(starButton).toBeInTheDocument();
    });

    it("shows empty star when repo is not starred", () => {
      render(
        <RepoCard repo={createMockRepo({ isStarredByCurrentUser: false })} />,
      );

      const starButton = screen.getByTitle("Star");
      expect(starButton).toBeInTheDocument();
    });

    it("disables star button when loading", () => {
      useStarRepository.mockReturnValue({
        starred: false,
        count: 42,
        loading: true,
        toggle: mockToggle,
      });

      render(<RepoCard repo={createMockRepo()} />);

      const starButton = screen.getByTitle("Star");
      expect(starButton).toBeDisabled();
      expect(starButton.className).toContain("opacity-50");
      expect(starButton.className).toContain("cursor-not-allowed");
    });

    it("prevents card click when star button is clicked", async () => {
      const user = userEvent.setup();
      render(<RepoCard repo={createMockRepo()} onClick={mockOnClick} />);

      const starButton = screen.getByTitle("Star");
      await user.click(starButton);

      expect(mockToggle).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("displays correct star count from useStarRepository", () => {
      useStarRepository.mockReturnValue({
        starred: false,
        count: 99,
        loading: false,
        toggle: mockToggle,
      });

      render(<RepoCard repo={createMockRepo()} />);

      expect(screen.getByText("99")).toBeInTheDocument();
    });
  });

  describe("Admin actions", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ role: "Admin" } as any);
    });

    it("shows edit and delete buttons for Admin users", () => {
      render(<RepoCard repo={createMockRepo()} />);

      expect(screen.getByTitle("Edit")).toBeInTheDocument();
      expect(screen.getByTitle("Delete")).toBeInTheDocument();
    });

    it("calls onEdit when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<RepoCard repo={createMockRepo()} onEdit={mockOnEdit} />);

      const editButton = screen.getByTitle("Edit");
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(
        expect.objectContaining({ id: "1" }),
      );
    });

    it("calls onDelete when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<RepoCard repo={createMockRepo()} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByTitle("Delete");
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(
        expect.objectContaining({ id: "1" }),
      );
    });

    it("prevents card click when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepoCard
          repo={createMockRepo()}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
        />,
      );

      const editButton = screen.getByTitle("Edit");
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("prevents card click when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepoCard
          repo={createMockRepo()}
          onClick={mockOnClick}
          onDelete={mockOnDelete}
        />,
      );

      const deleteButton = screen.getByTitle("Delete");
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalled();
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("handles very long repository names", () => {
      render(
        <RepoCard
          repo={createMockRepo({
            fullName:
              "organization/very-long-repository-name-that-exceeds-normal",
          })}
        />,
      );

      expect(
        screen.getByText(
          "organization/very-long-repository-name-that-exceeds-normal",
        ),
      ).toBeInTheDocument();
    });

    it("handles repository with no tags", () => {
      render(<RepoCard repo={createMockRepo({ tags: [] })} />);

      expect(screen.getByText("There are no tags")).toBeInTheDocument();
    });

    it("handles repository with maximum tags", () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag-${i + 1}`);
      render(<RepoCard repo={createMockRepo({ tags: manyTags })} />);

      expect(screen.getByText("tag-1")).toBeInTheDocument();
      expect(screen.getByText("tag-2")).toBeInTheDocument();
      expect(screen.getByText("tag-3")).toBeInTheDocument();
      expect(screen.getByText("+17")).toBeInTheDocument();
    });

    it("handles repository with special characters in name", () => {
      render(
        <RepoCard
          repo={createMockRepo({
            name: "my-repo_v2.test",
            fullName: "user/my-repo_v2.test",
          })}
        />,
      );

      expect(screen.getByText("user/my-repo_v2.test")).toBeInTheDocument();
      expect(screen.getByText("MY")).toBeInTheDocument(); // First two chars uppercase
    });

    it("handles empty description gracefully", () => {
      render(<RepoCard repo={createMockRepo({ description: "" })} />);

      const description = screen.queryByText("A test repository");
      expect(description).not.toBeInTheDocument();
    });

    it("handles null description gracefully", () => {
      render(<RepoCard repo={createMockRepo({ description: null as any })} />);

      expect(
        screen.queryByRole("paragraph", { name: /description/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Styling and structure", () => {
    it("renders visibility badge with correct accent class", () => {
      render(<RepoCard repo={createMockRepo({ visibility: "public" })} />);

      const publicTag = screen.getByText("public");
      expect(publicTag).toBeInTheDocument();
    });

    it("renders repo initials correctly", () => {
      render(<RepoCard repo={createMockRepo({ name: "MyAwesomeRepo" })} />);

      expect(screen.getByText("MY")).toBeInTheDocument();
    });

    it("renders single character initials for short names", () => {
      render(<RepoCard repo={createMockRepo({ name: "A" })} />);

      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible star button with title", () => {
      render(<RepoCard repo={createMockRepo()} />);

      expect(screen.getByTitle("Star")).toBeInTheDocument();
    });

    it("updates star button title when starred", () => {
      useStarRepository.mockReturnValue({
        starred: true,
        count: 42,
        loading: false,
        toggle: mockToggle,
      });

      render(
        <RepoCard repo={createMockRepo({ isStarredByCurrentUser: true })} />,
      );

      expect(screen.getByTitle("Unstar")).toBeInTheDocument();
    });
  });

  describe("Integration scenarios", () => {
    it("works as a complete public repository card", () => {
      render(
        <RepoCard
          repo={createMockRepo({
            fullName: "facebook/react",
            description: "A JavaScript library for building user interfaces",
            starCount: 200000,
            isStarredByCurrentUser: true,
            isOfficial: true,
          })}
          onClick={mockOnClick}
        />,
      );

      expect(screen.getByText("facebook/react")).toBeInTheDocument();
      expect(
        screen.getByText("A JavaScript library for building user interfaces"),
      ).toBeInTheDocument();
      expect(screen.getByText("Official")).toBeInTheDocument();
    });

    it("works as a private repository card for admin", () => {
      useAuth.mockReturnValue({ role: "Admin" } as any);

      render(
        <RepoCard
          repo={createMockRepo({
            visibility: "private",
            fullName: "company/internal-tools",
          })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("private")).toBeInTheDocument();
      expect(screen.getByTitle("Edit")).toBeInTheDocument();
      expect(screen.getByTitle("Delete")).toBeInTheDocument();
    });

    it("handles all interactions together", async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({ role: "Admin" } as any);

      render(
        <RepoCard
          repo={createMockRepo()}
          onClick={mockOnClick}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTitle("Star"));
      expect(mockToggle).toHaveBeenCalled();

      await user.click(screen.getByTitle("Edit"));
      expect(mockOnEdit).toHaveBeenCalled();

      await user.click(screen.getByTitle("Delete"));
      expect(mockOnDelete).toHaveBeenCalled();

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });
});
