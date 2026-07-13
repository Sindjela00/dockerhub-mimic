import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import RepoTable from "./RepoTable";
import { Repository } from "@/services/repositories/repositories.api";
import userEvent from "@testing-library/user-event";

const MOCK_REPOS: Repository[] = [
  {
    id: 1,
    name: "nginx",
    fullName: "john/nginx-repo",
    description:
      "Official build of Nginx — high performance HTTP server and reverse proxy.",
    visibility: "private",
    ownerEmail: "john@gmail.local",
    createdAt: "2026-03-22T16:09:54.9619039Z",
    updatedAt: "2026-03-22T16:09:54.9619039Z",
    isOfficial: false,
    starCount: 0,
    tags: [],
  },
  {
    id: 2,
    name: "nginx",
    fullName: "john/my-api",
    description:
      "Official build of Nginx — high performance HTTP server and reverse proxy.",
    visibility: "public",
    ownerEmail: "john@gmail.local",
    createdAt: "2026-03-22T16:09:54.9619039Z",
    updatedAt: "2026-03-21T16:09:54.9619039Z",
    isOfficial: false,
    starCount: 0,
    tags: [],
  },
];

describe("RepoTable", () => {
  it("renderuje header kolone", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
    expect(screen.getByText("Visibility")).toBeTruthy();
    expect(screen.getByText("Stars")).toBeTruthy();
    expect(screen.getByText("Updated")).toBeTruthy();
  });

  it("renderuje red za svaki repo", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getByText("john/nginx-repo")).toBeTruthy();
    expect(screen.getByText("john/my-api")).toBeTruthy();
  });

  it("prikazuje empty poruku kad nema repoa", () => {
    render(<RepoTable repos={[]} />);
    expect(screen.getByText("No repositories found.")).toBeTruthy();
  });

  it("poziva onClick sa repoom kad se klikne red", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<RepoTable repos={MOCK_REPOS} onClick={handleClick} />);
    await user.click(screen.getByText("john/nginx-repo"));

    expect(handleClick).toHaveBeenCalledWith(MOCK_REPOS[0]);
  });

  it("prikazuje visibility badge", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getByText("public")).toBeTruthy();
    expect(screen.getByText("private")).toBeTruthy();
  });

  it("poziva onEdit kad se klikne edit dugme i ne propagira klik na red", async () => {
    const handleEdit = vi.fn();
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <RepoTable
        repos={MOCK_REPOS}
        onClick={handleClick}
        onEdit={handleEdit}
      />,
    );
    await user.click(screen.getAllByTitle("Edit")[0]);

    expect(handleEdit).toHaveBeenCalledWith(MOCK_REPOS[0]);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("poziva onDelete kad se klikne delete dugme i ne propagira klik na red", async () => {
    const handleDelete = vi.fn();
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <RepoTable
        repos={MOCK_REPOS}
        onClick={handleClick}
        onDelete={handleDelete}
      />,
    );
    await user.click(screen.getAllByTitle("Delete")[0]);

    expect(handleDelete).toHaveBeenCalledWith(MOCK_REPOS[0]);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("ne baca gresku kad onEdit/onDelete nisu prosledjeni", async () => {
    const user = userEvent.setup();
    render(<RepoTable repos={MOCK_REPOS} />);

    await user.click(screen.getAllByTitle("Edit")[0]);
    await user.click(screen.getAllByTitle("Delete")[0]);
  });

  it("prikazuje official/verified/sponsored oznake i tagove", () => {
    const repos: Repository[] = [
      {
        ...MOCK_REPOS[0],
        isOfficial: true,
        isVerifiedPublisher: true,
        isSponsoredOss: true,
        tags: ["latest", "v1", "v2"],
      } as Repository,
    ];

    render(<RepoTable repos={repos} />);

    expect(screen.getByText("Official")).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Sponsored")).toBeTruthy();
    expect(screen.getByText("latest")).toBeTruthy();
    expect(screen.getByText("+1")).toBeTruthy();
  });
});
