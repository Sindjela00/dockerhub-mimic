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

// Mock hooks
const fetchMembersMock = vi.fn();
const addMemberMock = vi.fn();
const removeMemberMock = vi.fn();
const fetchOrgMembersMock = vi.fn();

const defaultMembers = [
  {
    userId: 1,
    username: "john",
    email: "john@test.com",
    addedAt: "2024-01-01",
  },
];

const useTeamMembersMock = vi.fn(() => ({
  members: defaultMembers,
  total: 1,
  loading: false,
  error: null,
  fetchMembers: fetchMembersMock,
  addMember: addMemberMock,
  removeMember: removeMemberMock,
}));

vi.mock("@/services/organizations/useTeamMembers/useTeamMembers", () => ({
  useTeamMembers: () => useTeamMembersMock(),
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
    useTeamMembersMock.mockReturnValue({
      members: defaultMembers,
      total: 1,
      loading: false,
      error: null,
      fetchMembers: fetchMembersMock,
      addMember: addMemberMock,
      removeMember: removeMemberMock,
    });
  });

  it("renders members count and table rows", () => {
    render(<MembersTab orgName="org" teamName="team" />);

    expect(screen.getByText("1 members")).toBeInTheDocument();
    expect(screen.getByText("john")).toBeInTheDocument();
    expect(screen.getAllByText("john@test.com").length).toBeGreaterThan(0);
    expect(screen.getByText("@john")).toBeInTheDocument();
  });

  it("calls fetchMembers and fetchOrgMembers on mount", () => {
    render(<MembersTab orgName="org" teamName="team" />);

    expect(fetchMembersMock).toHaveBeenCalledTimes(1);
    expect(fetchOrgMembersMock).toHaveBeenCalledWith("");
  });

  it("opens modal when clicking Add member", () => {
    render(<MembersTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByText(/add member/i));

    expect(screen.getByTestId("add-modal")).toBeInTheDocument();
  });

  it("calls removeMember when Remove is clicked", () => {
    render(<MembersTab orgName="org" teamName="team" />);

    fireEvent.click(screen.getByText("Remove"));

    expect(removeMemberMock).toHaveBeenCalledWith(1);
  });

  it("shows a loading state and hides the table", () => {
    useTeamMembersMock.mockReturnValue({
      members: [],
      total: 0,
      loading: true,
      error: null,
      fetchMembers: fetchMembersMock,
      addMember: addMemberMock,
      removeMember: removeMemberMock,
    });

    render(<MembersTab orgName="org" teamName="team" />);

    expect(screen.getByText("Loading members...")).toBeInTheDocument();
    expect(screen.queryByText("john")).not.toBeInTheDocument();
  });

  it("shows an error message and hides the table", () => {
    useTeamMembersMock.mockReturnValue({
      members: [],
      total: 0,
      loading: false,
      error: "Failed to load members.",
      fetchMembers: fetchMembersMock,
      addMember: addMemberMock,
      removeMember: removeMemberMock,
    });

    render(<MembersTab orgName="org" teamName="team" />);

    expect(screen.getByText("Failed to load members.")).toBeInTheDocument();
    expect(screen.queryByText("john")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no members", () => {
    useTeamMembersMock.mockReturnValue({
      members: [],
      total: 0,
      loading: false,
      error: null,
      fetchMembers: fetchMembersMock,
      addMember: addMemberMock,
      removeMember: removeMemberMock,
    });

    render(<MembersTab orgName="org" teamName="team" />);

    expect(screen.getByText("No members found.")).toBeInTheDocument();
  });
});
