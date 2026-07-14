import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TeamRepositoryList from "./TeamRepositoryList";

const baseRepos = [
  {
    repositoryId: 1,
    fullName: "org/repo-1",
    permission: "WRITE",
  },
  {
    repositoryId: 2,
    fullName: "org/repo-2",
    permission: "READ",
  },
];

describe("TeamRepositoryList", () => {
  it("shows loading state", () => {
    render(
      <TeamRepositoryList
        repos={[]}
        loading
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/loading repositories/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <TeamRepositoryList
        repos={[]}
        loading={false}
        error="Something went wrong"
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(
      <TeamRepositoryList
        repos={[]}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/no repositories assigned/i)).toBeInTheDocument();
  });

  it("renders repositories list", () => {
    render(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("org/repo-1")).toBeInTheDocument();
    expect(screen.getByText("org/repo-2")).toBeInTheDocument();
  });

  it("highlights current repository", () => {
    render(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={1}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("(this repo)")).toBeInTheDocument();
  });

  it("renders permission badges correctly", () => {
    render(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Write")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
  });

  it("shows remove button only for admin", () => {
    const { rerender } = render(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByTitle("Remove from team")).not.toBeInTheDocument();

    rerender(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={true}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getAllByTitle("Remove from team").length).toBeGreaterThan(0);
  });

  it("calls onRemove when clicking remove", () => {
    const onRemove = vi.fn();

    render(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={true}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getAllByTitle("Remove from team")[0]);

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it("disables remove button and shows spinner when removing", () => {
    render(
      <TeamRepositoryList
        repos={baseRepos}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={1}
        isAdmin={true}
        onRemove={vi.fn()}
      />,
    );

    const button = screen.getAllByTitle("Remove from team")[0];

    expect(button).toBeDisabled();
  });

  it("falls back to 'Read' permission for unknown values", () => {
    render(
      <TeamRepositoryList
        repos={[
          {
            repositoryId: 3,
            fullName: "org/repo-3",
            permission: "UNKNOWN",
          },
        ]}
        loading={false}
        error={null}
        currentRepoId={0}
        removingId={null}
        isAdmin={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Read")).toBeInTheDocument();
  });
});
