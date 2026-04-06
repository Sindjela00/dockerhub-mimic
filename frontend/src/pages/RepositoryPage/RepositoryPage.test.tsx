import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import RepositoryDetailPage from "./RepositoryDetailPage";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "1" }),
  };
});

vi.mock("@/services/repositories/useRepository/useRepository", () => ({
  useRepository: () => ({
    repo: {
      id: 1,
      name: "test-repo",
      fullName: "user/test-repo",
      description: "A test repository",
      visibility: "public",
      starCount: 5,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    loading: false,
    error: "",
    setRepo: vi.fn(),
  }),
}));

vi.mock("@/services/repositories/useTags/useTags", () => ({
  useTags: () => ({
    tags: [{ id: 1, name: "v1.0" }],
    total: 1,
    page: 1,
    pageSize: 10,
    search: "",
    sortBy: "createdAt",
    sortDir: "desc",
    setSearch: vi.fn(),
    setSortBy: vi.fn(),
    setSortDir: vi.fn(),
    changePage: vi.fn(),
    loading: false,
    error: "",
    deleteTags: vi.fn(),
  }),
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("RepositoryDetailPage", () => {
  it("renders repo details", () => {
    render(<RepositoryDetailPage />);

    expect(screen.getByText("user/test-repo")).toBeDefined();
    expect(screen.getByText("A test repository")).toBeDefined();
    expect(screen.getByText("public")).toBeDefined();

    const statBadges = screen.getAllByText("5");
    const starBadge = statBadges.find((el) => {
      const parentText = el.parentElement?.textContent?.toLowerCase();
      return parentText?.includes("stars");
    });
    expect(starBadge).toBeDefined();
  });

  it("copies command to clipboard", async () => {
    render(<RepositoryDetailPage />);

    const copyButton = screen.getByTitle("Copy");

    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "docker pull user/test-repo:latest",
    );

    const checkIcon = copyButton.querySelector("svg.text-success");
    expect(checkIcon).toBeTruthy();
  });

  it("switches tabs", () => {
    render(<RepositoryDetailPage />);
    const viewAllButton = screen.getByText("View all");
    fireEvent.click(viewAllButton);

    expect(screen.getByText("v1.0")).toBeDefined();
  });
});
