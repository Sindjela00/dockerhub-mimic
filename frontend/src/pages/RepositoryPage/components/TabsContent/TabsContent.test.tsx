import type {
  TagDetail,
  TagSortBy,
  TagSortDir,
} from "@/services/repositories/repositories.api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TagsTab from "./TabsContent";

vi.mock("@/components/Table/Table", () => ({
  default: ({ data }: any) => (
    <div>
      {data.map((d: any) => (
        <div key={d.name}>
          <input type="checkbox" aria-label={`Select ${d.name}`} />
          {d.name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/Pagination/Pagination", () => ({
  default: ({ page, onChange }: any) => (
    <button onClick={() => onChange(page + 1)}>Next page</button>
  ),
}));

vi.mock("@/utils/formatDate", () => ({
  formatDate: (d: any) => d,
}));
vi.mock("@/utils/timeAgo", () => ({
  timeAgo: (d: any) => d,
}));

describe("TagsTab", () => {
  const MOCK_TAGS: TagDetail[] = [
    {
      name: "tag1",
      digest: "abc",
      os: "linux",
      architecture: "amd64",
      size: "10MB",
      lastPushedAt: "2023-03-01",
      compressedSizeBytes: 0,
      lastPulledAt: null,
      lastPushedBy: "",
      pullCount: 0,
      mediaType: "",
      createdAt: "",
    },
    {
      name: "tag2",
      digest: "def",
      os: "linux",
      architecture: "amd64",
      size: "15MB",
      lastPushedAt: "2023-03-02",
      compressedSizeBytes: 0,
      lastPulledAt: null,
      lastPushedBy: "",
      pullCount: 0,
      mediaType: "",
      createdAt: "",
    },
  ];

  const defaultProps = {
    tags: MOCK_TAGS,
    total: 2,
    page: 1,
    pageSize: 10,
    loading: false,
    error: "",
    search: "",
    sortBy: "lastPushedAt" as TagSortBy,
    sortDir: "desc" as TagSortDir,
    onSearch: vi.fn(),
    onSortBy: vi.fn(),
    onSortDir: vi.fn(),
    onPage: vi.fn(),
    onDeleteTags: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all tags", () => {
    render(<TagsTab {...defaultProps} />);
    MOCK_TAGS.forEach((tag) => {
      expect(screen.getByText(tag.name)).toBeInTheDocument();
    });
  });

  it("updates local search and calls onSearch after debounce", async () => {
    render(<TagsTab {...defaultProps} />);
    const input = screen.getByPlaceholderText("Search tags...");
    fireEvent.change(input, { target: { value: "tag1" } });

    await waitFor(
      () => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith("tag1");
      },
      { timeout: 500 },
    );
  });

  it("toggles sort direction", () => {
    render(<TagsTab {...defaultProps} />);
    const button = screen.getByText("Newest first");
    fireEvent.click(button);
    expect(defaultProps.onSortDir).toHaveBeenCalledWith("asc");
  });

  it("calls onPage when pagination next is clicked", () => {
    render(<TagsTab {...defaultProps} />);
    const nextPageBtn = screen.getByText("Next page");
    fireEvent.click(nextPageBtn);

    expect(defaultProps.onPage).toHaveBeenCalledWith(2);
  });
});
