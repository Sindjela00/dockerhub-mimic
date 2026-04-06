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
    updatedAt: "2026-03-22T16:09:54.9619039Z",
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
});
