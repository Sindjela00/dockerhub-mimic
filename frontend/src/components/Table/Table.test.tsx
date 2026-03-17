import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ColumnDef } from "./types/types";
import Table from "./Table";
import userEvent from "@testing-library/user-event";

// ─── Test data ────────────────────────────────────────────────────────────────

interface Person {
  id: string;
  name: string;
  age: number;
  role: string;
}

const MOCK_DATA: Person[] = [
  { id: "1", name: "Ana", age: 25, role: "Admin" },
  { id: "2", name: "Maja", age: 30, role: "User" },
  { id: "3", name: "Jovana", age: 22, role: "User" },
];

const COLUMNS: ColumnDef<Person>[] = [
  {
    key: "name",
    header: "Name",
    render: (row) => <span>{row.name}</span>,
  },
  {
    key: "age",
    header: "Age",
    align: "right",
    hideBelow: "md",
    render: (row) => <span>{row.age}</span>,
  },
  {
    key: "role",
    header: "Role",
    render: (row) => <span>{row.role}</span>,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Table", () => {
  it("renderuje header kolone", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Age")).toBeTruthy();
    expect(screen.getByText("Role")).toBeTruthy();
  });

  it("renderuje red za svaki objekat", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByText("Maja")).toBeTruthy();
    expect(screen.getByText("Jovana")).toBeTruthy();
  });

  it("prikazuje emptyText kad nema podataka", () => {
    render(
      <Table
        columns={COLUMNS}
        data={[]}
        rowKey={(r) => r.id}
        emptyText="Nema podataka."
      />,
    );
    expect(screen.getByText("Nema podataka.")).toBeTruthy();
  });

  it("prikazuje default emptyText kad nije prosleđen", () => {
    render(<Table columns={COLUMNS} data={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText("No data available.")).toBeTruthy();
  });

  it("poziva onRowClick sa ispravnim redom", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onRowClick={handleClick}
      />,
    );

    await user.click(screen.getByText("Ana"));
    expect(handleClick).toHaveBeenCalledWith(MOCK_DATA[0]);
  });

  it("ne poziva onRowClick kad nije prosleđen", async () => {
    const user = userEvent.setup();
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    await user.click(screen.getByText("Ana"));
  });

  it("primenjuje right align na koloni", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    const ageTh = screen.getByText("Age").closest("th");
    expect(ageTh?.className).toContain("text-right");
  });

  it("primenjuje hideBelow klasu na koloni", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    const ageTh = screen.getByText("Age").closest("th");
    expect(ageTh?.className).toContain("hidden md:table-cell");
  });

  it("renderuje custom cell sadržaj", () => {
    const columnsWithBadge: ColumnDef<Person>[] = [
      {
        key: "role",
        header: "Role",
        render: (row) => <span data-testid="role-badge">{row.role}</span>,
      },
    ];

    render(
      <Table
        columns={columnsWithBadge}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
      />,
    );

    const badges = screen.getAllByTestId("role-badge");
    expect(badges).toHaveLength(3);
  });

  it("cursor pointer klasa kad postoji onRowClick", () => {
    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onRowClick={vi.fn()}
      />,
    );
    const row = screen.getByText("Ana").closest("tr");
    expect(row?.className).toContain("cursor-pointer");
  });

  it("nema cursor pointer klase bez onRowClick", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    const row = screen.getByText("Ana").closest("tr");
    expect(row?.className).not.toContain("cursor-pointer");
  });

  it("wrapper ima overflow-x-auto za mobilni scroll", () => {
    const { container } = render(
      <Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper?.className).toContain("overflow-x-auto");
  });
});
