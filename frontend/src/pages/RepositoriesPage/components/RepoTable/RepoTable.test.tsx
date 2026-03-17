import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import RepoTable from "./RepoTable";
import { Repository } from "../../types/types";
import userEvent from "@testing-library/user-event";

const MOCK_REPOS: Repository[] = [
  {
    id: "1",
    name: "nginx",
    namespace: "john.doe",
    description: "Official build of Nginx.",
    visibility: "public",
    pullCount: 142300,
    stars: 48,
    tags: ["latest", "1.25"],
    updatedAt: "2025-03-10T12:00:00Z",
  },
  {
    id: "2",
    name: "my-api",
    namespace: "john.doe",
    description: "REST API.",
    visibility: "private",
    pullCount: 3200,
    stars: 5,
    tags: ["latest"],
    updatedAt: "2025-03-14T08:30:00Z",
  },
];

describe("RepoTable", () => {
  it("renderuje header kolone", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
    expect(screen.getByText("Visibility")).toBeTruthy();
    expect(screen.getByText("Pulls")).toBeTruthy();
    expect(screen.getByText("Stars")).toBeTruthy();
    expect(screen.getByText("Updated")).toBeTruthy();
  });

  it("renderuje red za svaki repo", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getByText("john.doe/nginx")).toBeTruthy();
    expect(screen.getByText("john.doe/my-api")).toBeTruthy();
  });

  it("prikazuje empty poruku kad nema repoa", () => {
    render(<RepoTable repos={[]} />);
    expect(screen.getByText("No repositories found.")).toBeTruthy();
  });

  it("poziva onClick sa repoom kad se klikne red", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<RepoTable repos={MOCK_REPOS} onClick={handleClick} />);
    await user.click(screen.getByText("john.doe/nginx"));

    expect(handleClick).toHaveBeenCalledWith(MOCK_REPOS[0]);
  });

  it("prikazuje visibility badge", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getByText("public")).toBeTruthy();
    expect(screen.getByText("private")).toBeTruthy();
  });

  it("prikazuje tagove", () => {
    render(<RepoTable repos={MOCK_REPOS} />);
    expect(screen.getAllByText("latest").length).toBeGreaterThanOrEqual(1);
  });
});
