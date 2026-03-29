/**
 * @vitest-environment jsdom
 */

import type {
  TagDetail,
  TagSortBy,
  TagSortDir,
} from "@/services/repositories/repositories.api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TagsTab from "./TabsContent";
import userEvent from "@testing-library/user-event";

const MOCK_TAGS: TagDetail[] = [
  {
    name: "latest",
    digest: "sha256:123",
    os: "linux",
    architecture: "amd64",
    size: "10MB",
    lastPushedAt: "2025-03-10T12:00:00Z",
    compressedSizeBytes: 0,
    lastPulledAt: null,
    lastPushedBy: "",
    pullCount: 0,
    mediaType: "",
    createdAt: "",
  },
  {
    name: "v1.0.0",
    digest: "sha256:456",
    os: "linux",
    architecture: "amd64",
    size: "8MB",
    lastPushedAt: "2025-01-10T12:00:00Z",
    compressedSizeBytes: 0,
    lastPulledAt: null,
    lastPushedBy: "",
    pullCount: 0,
    mediaType: "",
    createdAt: "",
  },
];

describe("TagsTab", () => {
  let onSearch: (v: string) => void;
  let onSortBy: (v: TagSortBy) => void;
  let onSortDir: (v: TagSortDir) => void;
  let onPage: (p: number) => void;

  beforeEach(() => {
    onSearch = vi.fn<(v: string) => void>();
    onSortBy = vi.fn<(v: TagSortBy) => void>();
    onSortDir = vi.fn<(v: TagSortDir) => void>();
    onPage = vi.fn<(p: number) => void>();
    vi.useFakeTimers();
  });

  const renderComponent = (props = {}) =>
    render(
      <TagsTab
        tags={MOCK_TAGS}
        total={2}
        page={1}
        pageSize={10}
        loading={false}
        error=""
        search=""
        sortBy="pulls"
        sortDir="desc"
        onSearch={onSearch}
        onSortBy={onSortBy}
        onSortDir={onSortDir}
        onPage={onPage}
        {...props}
      />,
    );

  it("renderuje tabelu sa tagovima", () => {
    renderComponent();

    expect(screen.getByText("latest")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });

  it("može selektovati sve tagove", () => {
    renderComponent();

    const selectAll = screen.getByLabelText(
      "Select all tags",
    ) as HTMLInputElement;
    expect(selectAll.checked).toBe(false);

    fireEvent.click(selectAll);

    MOCK_TAGS.forEach((tag) => {
      const checkbox = screen.getByLabelText(
        `Select ${tag.name}`,
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  it("toggle jednog taga", () => {
    renderComponent();

    const checkbox = screen.getByLabelText("Select latest") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it("poziva onSortDir kada se klikne dugme za sortiranje", () => {
    renderComponent();

    const sortBtn = screen.getByRole("button", { name: /newest first/i });
    fireEvent.click(sortBtn);

    expect(onSortDir).toHaveBeenCalledWith("asc");
  });

  it("prikazuje empty text kada nema tagova", () => {
    renderComponent({ tags: [], search: "nothing" });

    expect(screen.getByText('No tags match "nothing"')).toBeInTheDocument();
  });
});
