import type {
  TagDetail,
  TagSortBy,
  TagSortDir,
} from "@/services/repositories/repositories.api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TagsTab from "./TabsContent";

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
      os: null,
      architecture: null,
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

  it("renders all tags with digest, os/arch and size columns", () => {
    render(<TagsTab {...defaultProps} />);
    MOCK_TAGS.forEach((tag) => {
      expect(screen.getByText(tag.name)).toBeInTheDocument();
    });
    expect(screen.getByText("linux / amd64")).toBeInTheDocument();
    expect(screen.getByText("- / -")).toBeInTheDocument();
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

  it("does not render pagination when there are no tags", () => {
    render(<TagsTab {...defaultProps} tags={[]} total={0} />);
    expect(screen.queryByText("Next page")).not.toBeInTheDocument();
  });

  it("shows a search-specific empty message when there are no tags and a search is active", () => {
    render(<TagsTab {...defaultProps} tags={[]} total={0} search="foo" />);
    expect(screen.getByText('No tags match "foo"')).toBeInTheDocument();
  });

  describe("selection", () => {
    it("selects a single tag and shows the bulk-delete button", () => {
      render(<TagsTab {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Select tag1"));

      expect(screen.getByText("Delete 1 tag")).toBeInTheDocument();
    });

    it("selects all tags via the header checkbox and pluralizes the label", () => {
      render(<TagsTab {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Select all tags"));

      expect(screen.getByText("Delete 2 tags")).toBeInTheDocument();
    });

    it("deselects all tags when header checkbox is toggled again", () => {
      render(<TagsTab {...defaultProps} />);
      const selectAll = screen.getByLabelText("Select all tags");
      fireEvent.click(selectAll);
      fireEvent.click(selectAll);

      expect(screen.queryByText(/Delete \d/)).not.toBeInTheDocument();
    });

    it("deselects a single tag when its checkbox is toggled again", () => {
      render(<TagsTab {...defaultProps} />);
      const checkbox = screen.getByLabelText("Select tag1");
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);

      expect(screen.queryByText(/Delete \d/)).not.toBeInTheDocument();
    });

    it("calls onDeleteTags with selected names and clears selection on bulk delete", async () => {
      render(<TagsTab {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Select tag1"));
      fireEvent.click(screen.getByText(/Delete 1 tag/));

      await waitFor(() =>
        expect(defaultProps.onDeleteTags).toHaveBeenCalledWith(["tag1"]),
      );

      await waitFor(() =>
        expect(screen.queryByText(/Delete \d/)).not.toBeInTheDocument(),
      );
    });

    it("shows Deleting... and disables the button while bulk delete is in flight", async () => {
      let resolve!: () => void;
      const onDeleteTags = vi.fn(
        () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      );
      render(<TagsTab {...defaultProps} onDeleteTags={onDeleteTags} />);

      fireEvent.click(screen.getByLabelText("Select tag1"));
      fireEvent.click(screen.getByText(/Delete 1 tag/));

      expect(screen.getByText("Deleting...")).toBeInTheDocument();

      resolve();
      await waitFor(() =>
        expect(screen.queryByText("Deleting...")).not.toBeInTheDocument(),
      );
    });
  });
});
