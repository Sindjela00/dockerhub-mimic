import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ColumnDef } from "./types/types";
import Table from "./Table";
import userEvent from "@testing-library/user-event";

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
    sortable: true,
    render: (row) => <span>{row.age}</span>,
  },
  {
    key: "role",
    header: "Role",
    render: (row) => <span>{row.role}</span>,
  },
];

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

  it("renderuje custom cell sadržaj", () => {
    const cols: ColumnDef<Person>[] = [
      {
        key: "role",
        header: "Role",
        render: (row) => <span data-testid="badge">{row.role}</span>,
      },
    ];
    render(<Table columns={cols} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getAllByTestId("badge")).toHaveLength(3);
  });

  it("primenjuje right align na koloni", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getByText("Age").closest("th")?.className).toContain(
      "text-right",
    );
  });

  it("primenjuje hideBelow klasu na koloni", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getByText("Age").closest("th")?.className).toContain(
      "hidden md:table-cell",
    );
  });

  it("wrapper ima overflow-hidden", () => {
    const { container } = render(
      <Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />,
    );
    expect((container.firstChild as HTMLElement)?.className).toContain(
      "overflow-hidden",
    );
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

  it("cursor pointer klasa kad postoji onRowClick", () => {
    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onRowClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Ana").closest("tr")?.className).toContain(
      "cursor-pointer",
    );
  });

  it("nema cursor pointer klase bez onRowClick", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getByText("Ana").closest("tr")?.className).not.toContain(
      "cursor-pointer",
    );
  });

  it("sortabilni header poziva onSort sa asc na prvom kliku", async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onSort={handleSort}
        sortKey=""
        sortDir="asc"
      />,
    );
    await user.click(screen.getByText("Age").closest("th")!);
    expect(handleSort).toHaveBeenCalledWith("age", "asc");
  });

  it("sortabilni header poziva onSort sa desc kad je već aktivan asc", async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onSort={handleSort}
        sortKey="age"
        sortDir="asc"
      />,
    );
    await user.click(screen.getByText("Age").closest("th")!);
    expect(handleSort).toHaveBeenCalledWith("age", "desc");
  });

  it("nesortabilni header ne poziva onSort", async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onSort={handleSort}
        sortKey=""
        sortDir="asc"
      />,
    );
    await user.click(screen.getByText("Name").closest("th")!);
    expect(handleSort).not.toHaveBeenCalled();
  });

  it("sortabilni header nema cursor-pointer bez onSort", () => {
    render(<Table columns={COLUMNS} data={MOCK_DATA} rowKey={(r) => r.id} />);
    expect(screen.getByText("Age").closest("th")?.className).not.toContain(
      "cursor-pointer",
    );
  });

  it("aktivni sort header ima text-text-primary klasu", () => {
    render(
      <Table
        columns={COLUMNS}
        data={MOCK_DATA}
        rowKey={(r) => r.id}
        onSort={vi.fn()}
        sortKey="age"
        sortDir="asc"
      />,
    );
    expect(screen.getByText("Age").closest("th")?.className).toContain(
      "text-text-primary",
    );
  });
});
