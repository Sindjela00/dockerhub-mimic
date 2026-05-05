import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import AcceptInvitePage from "./AcceptInvitePage";
import { acceptOrganizationInvite } from "@/services/organizations/organizations.api";
import { useAuth } from "@/context/AppContext";
import { useSearchParams } from "react-router-dom";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: vi.fn(),
}));

vi.mock("@/services/organizations/organizations.api", () => ({
  acceptOrganizationInvite: vi.fn(),
}));

vi.mock("@/context/AppContext", () => ({
  useAuth: vi.fn(),
}));

function setSearchParams(params: Record<string, string>) {
  const sp = new URLSearchParams(params);
  vi.mocked(useSearchParams).mockReturnValue([sp, vi.fn()] as any);
}

function setLoggedIn(value: boolean) {
  vi.mocked(useAuth).mockReturnValue({ isLoggedIn: value } as any);
}

describe("AcceptInvitePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLoggedIn(true);
    setSearchParams({ token: "valid-token-123" });
  });

  it("shows loading state initially", () => {
    vi.mocked(acceptOrganizationInvite).mockReturnValue(new Promise(() => {}));

    render(<AcceptInvitePage />);

    expect(screen.getByText("Accepting invite...")).toBeInTheDocument();
    expect(
      screen.getByText("Please wait while we process your invitation."),
    ).toBeInTheDocument();
  });

  it("shows invalid state when no token is present in the URL", () => {
    setSearchParams({});

    render(<AcceptInvitePage />);

    expect(screen.getByText("Invalid invite link")).toBeInTheDocument();
    expect(
      screen.getByText(/No invite token found in the URL/i),
    ).toBeInTheDocument();
  });

  it("redirects to login with returnTo when user is not logged in", () => {
    setLoggedIn(false);

    render(<AcceptInvitePage />);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/login?returnTo=${encodeURIComponent("/invites/accept?token=valid-token-123")}`,
      { replace: true },
    );
    expect(acceptOrganizationInvite).not.toHaveBeenCalled();
  });

  it("shows success state with org name after accepting invite", async () => {
    vi.mocked(acceptOrganizationInvite).mockResolvedValue({
      organizationName: "Acme Corp",
    });

    render(<AcceptInvitePage />);

    await waitFor(() => {
      expect(screen.getByText("You're in!")).toBeInTheDocument();
    });

    expect(
      screen.getByText("You've successfully joined Acme Corp."),
    ).toBeInTheDocument();
  });

  it("shows generic success message when org name is absent", async () => {
    vi.mocked(acceptOrganizationInvite).mockResolvedValue({});

    render(<AcceptInvitePage />);

    await waitFor(() => {
      expect(screen.getByText("You're in!")).toBeInTheDocument();
    });

    expect(
      screen.getByText("You've successfully joined the organization."),
    ).toBeInTheDocument();
  });

  it("renders 'Go to organization' button only when org name is provided", async () => {
    vi.mocked(acceptOrganizationInvite).mockResolvedValue({
      organizationName: "Acme Corp",
    });

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("Go to organization")).toBeInTheDocument(),
    );
    expect(screen.getByText("Go to dashboard")).toBeInTheDocument();
  });

  it("does not render 'Go to organization' button when org name is absent", async () => {
    vi.mocked(acceptOrganizationInvite).mockResolvedValue({});

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("Go to dashboard")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Go to organization")).not.toBeInTheDocument();
  });

  it("shows error state with message from API response", async () => {
    vi.mocked(acceptOrganizationInvite).mockRejectedValue({
      response: { data: { message: "Invite has already been used." } },
    });

    render(<AcceptInvitePage />);

    await waitFor(() => {
      expect(screen.getByText("Invite failed")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Invite has already been used."),
    ).toBeInTheDocument();
  });

  it("falls back to error field when message is absent", async () => {
    vi.mocked(acceptOrganizationInvite).mockRejectedValue({
      response: { data: { error: "Token expired." } },
    });

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("Invite failed")).toBeInTheDocument(),
    );

    expect(screen.getByText("Token expired.")).toBeInTheDocument();
  });

  it("falls back to generic error message when response carries no detail", async () => {
    vi.mocked(acceptOrganizationInvite).mockRejectedValue(
      new Error("Network error"),
    );

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("Invite failed")).toBeInTheDocument(),
    );

    expect(
      screen.getByText("The invite link is invalid or has expired."),
    ).toBeInTheDocument();
  });

  it("navigates to the organization page when 'Go to organization' is clicked", async () => {
    vi.mocked(acceptOrganizationInvite).mockResolvedValue({
      organizationName: "Acme Corp",
    });

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("Go to organization")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByText("Go to organization"));
    expect(mockNavigate).toHaveBeenCalledWith("/organizations/Acme Corp");
  });

  it("navigates to dashboard when 'Go to dashboard' is clicked on error", async () => {
    vi.mocked(acceptOrganizationInvite).mockRejectedValue(new Error());

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("Go to dashboard")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByText("Go to dashboard"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("calls acceptOrganizationInvite exactly once even in strict mode double-effect", async () => {
    vi.mocked(acceptOrganizationInvite).mockResolvedValue({
      organizationName: "Acme Corp",
    });

    render(<AcceptInvitePage />);

    await waitFor(() =>
      expect(screen.getByText("You're in!")).toBeInTheDocument(),
    );

    expect(acceptOrganizationInvite).toHaveBeenCalledTimes(1);
    expect(acceptOrganizationInvite).toHaveBeenCalledWith("valid-token-123");
  });
});
