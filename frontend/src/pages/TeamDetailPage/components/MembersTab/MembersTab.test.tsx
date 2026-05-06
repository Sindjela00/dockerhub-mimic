import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { MembersTab } from "./MembersTab";

// Mock components that are not relevant for logic testing
vi.mock("@/components/Modals/AddTeamMemberModal/AddTeamMemberModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="add-modal">Modal Open</div> : null,
}));

vi.mock("@/components/Avatar/Avatar", () => ({
  Avatar: () => <div data-testid="avatar" />,
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/Table/Table", () => ({
  default: ({ data }: any) => (
    <div data-testid="table">
      {data.map((m: any) => (
        <div key={m.userId}>{m.username}</div>
      ))}
    </div>
  ),
}));

// Mock hooks
const fetchMembersMock = vi.fn();
const addMemberMock = vi.fn();
const removeMemberMock = vi.fn();
const fetchOrgMembersMock = vi.fn();

vi.mock("@/services/organizations/useTeamMembers/useTeamMembers", () => ({
  useTeamMembers: () => ({
    members: [
      {
        userId: 1,
        username: "john",
        email: "john@test.com",
        addedAt: "2024-01-01",
      },
    ],
    total: 1,
    loading: false,
    error: null,
    fetchMembers: fetchMembersMock,
    addMember: addMemberMock,
    removeMember: removeMemberMock,
  }),
}));

vi.mock(
  "@/services/organizations/useOrganizationMembers/useOrganizationMembers",
  () => ({
    useOrganizationMembers: () => ({
      members: [
        { userId: 1, username: "john" },
        { userId: 2, username: "jane" },
      ],
      fetchMembers: fetchOrgMembersMock,
    }),
  }),
);

describe("MembersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders members count and table", () => {
    render(<MembersTab orgName="org" teamName="team" token="token" />);

    expect(screen.getByText("1 members")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByText("john")).toBeInTheDocument();
  });

  it("calls fetchMembers and fetchOrgMembers on mount", () => {
    render(<MembersTab orgName="org" teamName="team" token="token" />);

    expect(fetchMembersMock).toHaveBeenCalledTimes(1);
    expect(fetchOrgMembersMock).toHaveBeenCalledWith("");
  });

  it("opens modal when clicking Add member", () => {
    render(<MembersTab orgName="org" teamName="team" token="token" />);

    fireEvent.click(screen.getByText(/add member/i));

    expect(screen.getByTestId("add-modal")).toBeInTheDocument();
  });
});
