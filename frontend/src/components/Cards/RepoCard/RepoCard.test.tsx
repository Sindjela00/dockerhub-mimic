import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import RepoCard from "./RepoCard";
import { Repository } from "../../../pages/RepositoriesPage/types/types";
import userEvent from "@testing-library/user-event";

const MOCK_REPO: Repository = {
  id: "1",
  name: "nginx",
  namespace: "john.doe",
  description: "Official build of Nginx.",
  visibility: "public",
  pullCount: 142300,
  stars: 48,
  tags: ["latest", "1.25", "alpine"],
  updatedAt: "2025-03-10T12:00:00Z",
};

const PRIVATE_REPO: Repository = {
  ...MOCK_REPO,
  id: "2",
  visibility: "private",
};

describe("RepoCard", () => {
  it("renderuje ime repoa", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
  });

  it("renderuje opis", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("Official build of Nginx.")).toBeTruthy();
  });

  it("prikazuje public badge", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("public")).toBeTruthy();
  });

  it("prikazuje private badge", () => {
    render(<RepoCard repo={PRIVATE_REPO} />);
    expect(screen.getByText("private")).toBeTruthy();
  });

  it("prikazuje tagove", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("latest")).toBeTruthy();
    expect(screen.getByText("1.25")).toBeTruthy();
  });

  it("prikazuje +N kad ima više od 3 taga", () => {
    const repo = { ...MOCK_REPO, tags: ["a", "b", "c", "d", "e"] };
    render(<RepoCard repo={repo} />);
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("prikazuje pull count formatirano", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText(/142\.3k pulls/i)).toBeTruthy();
  });

  it("prikazuje stars", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("48")).toBeTruthy();
  });

  it("poziva onClick kad se klikne", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<RepoCard repo={MOCK_REPO} onClick={handleClick} />);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledWith(MOCK_REPO);
  });

  it("ne puca bez onClick prop-a", async () => {
    const user = userEvent.setup();
    render(<RepoCard repo={MOCK_REPO} />);
    await user.click(screen.getByRole("button"));
  });
});
