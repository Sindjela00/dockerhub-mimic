import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import RepoCard from "./RepoCard";
import type { Repository } from "@/pages/RepositoriesPage/types/types";
import userEvent from "@testing-library/user-event";

const MOCK_REPO: Repository = {
  id: 1,
  name: "nginx",
  fullName: "john/nginx",
  description: "Official build of Nginx.",
  visibility: "public",
  ownerEmail: "john@example.com",
  createdAt: "2023-01-15T08:00:00Z",
  updatedAt: "2025-03-10T12:00:00Z",
  isOfficial: false,
  starCount: 48,
  tags: ["latest", "1.25", "alpine"],
};

const PRIVATE_REPO: Repository = {
  ...MOCK_REPO,
  id: 2,
  visibility: "private",
};

const OFFICIAL_REPO: Repository = {
  ...MOCK_REPO,
  id: 3,
  isOfficial: true,
};

const NO_TAGS_REPO: Repository = {
  ...MOCK_REPO,
  id: 4,
  tags: [],
};

describe("RepoCard", () => {
  it("renderuje fullName repoa", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("john/nginx")).toBeTruthy();
  });

  it("renderuje opis", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("Official build of Nginx.")).toBeTruthy();
  });

  it("ne prikazuje opis ako je prazan", () => {
    render(<RepoCard repo={{ ...MOCK_REPO, description: "" }} />);
    expect(screen.queryByText("Official build of Nginx.")).toBeNull();
  });

  it("renderuje datum poslednjeg update-a", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText(/updated/i)).toBeTruthy();
  });

  it("prikazuje inicijale u avataru", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("NG")).toBeTruthy();
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

  it("prikazuje max 3 taga", () => {
    const repo = { ...MOCK_REPO, tags: ["a", "b", "c", "d", "e"] };
    render(<RepoCard repo={repo} />);
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();
    expect(screen.getByText("c")).toBeTruthy();
    expect(screen.queryByText("d")).toBeNull();
  });

  it("prikazuje +N kad ima više od 3 taga", () => {
    const repo = { ...MOCK_REPO, tags: ["a", "b", "c", "d", "e"] };
    render(<RepoCard repo={repo} />);
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("ne prikazuje tags sekciju kad nema tagova", () => {
    render(<RepoCard repo={NO_TAGS_REPO} />);
    expect(screen.queryByText("latest")).toBeNull();
  });

  it("prikazuje starCount", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.getByText("48")).toBeTruthy();
  });

  it("prikazuje Official badge kad je isOfficial true", () => {
    render(<RepoCard repo={OFFICIAL_REPO} />);
    expect(screen.getByText("Official")).toBeTruthy();
  });

  it("ne prikazuje Official badge kad je isOfficial false", () => {
    render(<RepoCard repo={MOCK_REPO} />);
    expect(screen.queryByText("Official")).toBeNull();
  });

  it("ne puca bez onClick prop-a", async () => {
    const user = userEvent.setup();
    render(<RepoCard repo={MOCK_REPO} />);
    await user.click(screen.getByRole("button", { name: /john\/nginx/i }));
  });

  it("prikazuje edit dugme", () => {
    render(<RepoCard repo={MOCK_REPO} onEdit={vi.fn()} />);
    expect(screen.getByTitle("Edit")).toBeTruthy();
  });

  it("poziva onEdit sa repoom", async () => {
    const handleEdit = vi.fn();
    const user = userEvent.setup();

    render(<RepoCard repo={MOCK_REPO} onEdit={handleEdit} />);
    await user.click(screen.getByTitle("Edit"));

    expect(handleEdit).toHaveBeenCalledWith(MOCK_REPO);
  });

  it("edit klik ne triggeruje onClick", async () => {
    const handleClick = vi.fn();
    const handleEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <RepoCard repo={MOCK_REPO} onClick={handleClick} onEdit={handleEdit} />,
    );
    await user.click(screen.getByTitle("Edit"));

    expect(handleEdit).toHaveBeenCalledOnce();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("prikazuje delete dugme", () => {
    render(<RepoCard repo={MOCK_REPO} onDelete={vi.fn()} />);
    expect(screen.getByTitle("Delete")).toBeTruthy();
  });

  it("poziva onDelete sa repoom", async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(<RepoCard repo={MOCK_REPO} onDelete={handleDelete} />);
    await user.click(screen.getByTitle("Delete"));

    expect(handleDelete).toHaveBeenCalledWith(MOCK_REPO);
  });

  it("delete klik ne triggeruje onClick", async () => {
    const handleClick = vi.fn();
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <RepoCard
        repo={MOCK_REPO}
        onClick={handleClick}
        onDelete={handleDelete}
      />,
    );
    await user.click(screen.getByTitle("Delete"));

    expect(handleDelete).toHaveBeenCalledOnce();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
