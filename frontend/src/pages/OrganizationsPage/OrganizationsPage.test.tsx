import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryRouter } from "react-router-dom";
import OrganizationsPage from "./OrganizationsPage";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/services/organizations/useOrganizations/useOrganizations";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock("@/services/organizations/useOrganizations/useOrganizations", () => ({
  useOrganizations: vi.fn(),
}));

vi.mock("@/components/Loader/Loader", () => ({
  default: () => <div data-testid="loader">Loading...</div>,
}));
vi.mock("@/components/Button/Button", () => ({
  default: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@/components/InputField/InputField", () => ({
  default: ({ value, onChangeRaw, placeholder }: any) => (
    <input
      value={value}
      onChange={onChangeRaw}
      placeholder={placeholder}
      data-testid="search-input"
    />
  ),
}));
vi.mock("@/components/Cards/OrganizationCard/OrganizationCard", () => ({
  default: ({ org, onClick }: any) => (
    <div data-testid={`org-card-${org.name}`} onClick={onClick}>
      {org.name}
    </div>
  ),
}));
vi.mock("@/components/Pagination/Pagination", () => ({
  default: ({ page, onChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onChange(page + 1)}>Next page</button>
    </div>
  ),
}));
vi.mock(
  "@/components/Modals/CreateOrganizationModal/CreateOrganizationModal",
  () => ({
    default: ({ isOpen, onClose, onSuccess }: any) =>
      isOpen ? (
        <div role="dialog" aria-label="create-org">
          <button onClick={onClose}>Close</button>
          <button onClick={onSuccess}>Create</button>
        </div>
      ) : null,
  }),
);

// ── Imports (after mocks) ─────────────────────────────────────────────────────

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockFetchOrganizations = vi.fn();

const mockOrg = { name: "alpha-org", memberCount: 3 };
const mockOrg2 = { name: "beta-org", memberCount: 5 };

function setupMocks({
  orgs = [mockOrg],
  total = 1,
  page = 1,
  pageSize = 12,
  loading = false,
  error = null as string | null,
} = {}) {
  (useNavigate as any).mockReturnValue(mockNavigate);
  (useOrganizations as any).mockReturnValue({
    orgs,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchOrganizations: mockFetchOrganizations,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <OrganizationsPage />
    </MemoryRouter>,
  );
}

describe("OrganizationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial data fetching", () => {
    it("calls fetchOrganizations on mount with page 1", () => {
      setupMocks();
      renderPage();
      expect(mockFetchOrganizations).toHaveBeenCalledWith(1);
    });

    it("calls fetchOrganizations only once even on re-render", () => {
      setupMocks();
      const { rerender } = renderPage();
      rerender(
        <MemoryRouter>
          <OrganizationsPage />
        </MemoryRouter>,
      );
      expect(mockFetchOrganizations).toHaveBeenCalledTimes(1);
    });

  });

  describe("header", () => {
    it("renders page title", () => {
      setupMocks();
      renderPage();
      expect(screen.getByText("Organizations")).toBeInTheDocument();
    });

    it("renders singular organization count", () => {
      setupMocks({ total: 1 });
      renderPage();
      expect(screen.getByText("1 organization")).toBeInTheDocument();
    });

    it("renders plural organizations count", () => {
      setupMocks({ total: 5 });
      renderPage();
      expect(screen.getByText("5 organizations")).toBeInTheDocument();
    });

    it("renders zero organizations count", () => {
      setupMocks({ total: 0, orgs: [] });
      renderPage();
      expect(screen.getByText("0 organizations")).toBeInTheDocument();
    });

    it("renders New organization button in header", () => {
      setupMocks();
      renderPage();
      const buttons = screen.getAllByRole("button", {
        name: /New organization/i,
      });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("error state", () => {
    it("shows error message", () => {
      setupMocks({ error: "Failed to load", orgs: [] });
      renderPage();
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("hides search input when error is present", () => {
      setupMocks({ error: "Oops", orgs: [] });
      renderPage();
      expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
    });

    it("hides org grid when error is present", () => {
      setupMocks({ error: "Oops", orgs: [mockOrg] });
      renderPage();
      expect(
        screen.queryByTestId("org-card-alpha-org"),
      ).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loader while fetching", () => {
      setupMocks({ loading: true, orgs: [] });
      renderPage();
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    it("hides org grid while loading", () => {
      setupMocks({ loading: true, orgs: [mockOrg] });
      renderPage();
      expect(
        screen.queryByTestId("org-card-alpha-org"),
      ).not.toBeInTheDocument();
    });

    it("shows search input while loading", () => {
      setupMocks({ loading: true, orgs: [] });
      renderPage();
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });
  });

  describe("empty state — no orgs, no search", () => {
    it("shows no organizations message", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      expect(screen.getByText("No organizations yet")).toBeInTheDocument();
    });

    it("shows helper text", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      expect(
        screen.getByText("Create your first organization to get started."),
      ).toBeInTheDocument();
    });

    it("shows New organization button in empty state", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      const buttons = screen.getAllByRole("button", {
        name: /New organization/i,
      });
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("empty state — no orgs, with search", () => {
    it("shows no results message with search term", async () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "ghost" },
      });
      expect(screen.getByText(/"ghost"/)).toBeInTheDocument();
    });

    it("shows clear search button", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "ghost" },
      });
      expect(screen.getByText("Clear search")).toBeInTheDocument();
    });

    it("clears search and refetches on Clear search click", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "ghost" },
      });
      fireEvent.click(screen.getByText("Clear search"));
      expect(screen.queryByTestId("search-input")).toHaveValue("");
      expect(mockFetchOrganizations).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe("organization grid", () => {
    it("renders a card for each org", () => {
      setupMocks({ orgs: [mockOrg, mockOrg2], total: 2 });
      renderPage();
      expect(screen.getByTestId("org-card-alpha-org")).toBeInTheDocument();
      expect(screen.getByTestId("org-card-beta-org")).toBeInTheDocument();
    });

    it("navigates to org detail page on card click", () => {
      setupMocks({ orgs: [mockOrg] });
      renderPage();
      fireEvent.click(screen.getByTestId("org-card-alpha-org"));
      expect(mockNavigate).toHaveBeenCalledWith("/organizations/alpha-org");
    });
  });

  describe("search", () => {
    it("debounces fetchOrganizations by 300ms", async () => {
      setupMocks();
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "alpha" },
      });
      expect(mockFetchOrganizations).toHaveBeenCalledTimes(1); // only initial mount call

      act(() => vi.advanceTimersByTime(300));

      expect(mockFetchOrganizations).toHaveBeenCalledWith(1, "alpha");
    });

    it("does not call fetchOrganizations before debounce fires", () => {
      setupMocks();
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "alpha" },
      });
      act(() => vi.advanceTimersByTime(299));
      expect(mockFetchOrganizations).toHaveBeenCalledTimes(1); // mount only
    });

    it("resets debounce timer on rapid typing", () => {
      setupMocks();
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "a" },
      });
      act(() => vi.advanceTimersByTime(100));
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "al" },
      });
      act(() => vi.advanceTimersByTime(300));
      expect(mockFetchOrganizations).toHaveBeenLastCalledWith(1, "al");
      expect(mockFetchOrganizations).toHaveBeenCalledTimes(2); // mount + debounce
    });

    it("passes undefined for empty/whitespace search", () => {
      setupMocks();
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "   " },
      });
      act(() => vi.advanceTimersByTime(300));
      expect(mockFetchOrganizations).toHaveBeenLastCalledWith(1, undefined);
    });

    it("updates search input value as user types", () => {
      setupMocks();
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "beta" },
      });
      expect(screen.getByTestId("search-input")).toHaveValue("beta");
    });
  });

  describe("pagination", () => {
    it("renders pagination when orgs are present", () => {
      setupMocks({ orgs: [mockOrg], total: 20 });
      renderPage();
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    it("hides pagination when org list is empty", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("hides pagination while loading", () => {
      setupMocks({ orgs: [mockOrg], loading: true });
      renderPage();
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("calls fetchOrganizations with new page on page change", () => {
      setupMocks({ orgs: [mockOrg], total: 20, page: 1 });
      renderPage();
      fireEvent.click(screen.getByText("Next page"));
      expect(mockFetchOrganizations).toHaveBeenCalledWith(2, undefined);
    });

    it("passes current search term when changing page", () => {
      setupMocks({ orgs: [mockOrg], total: 20, page: 1 });
      renderPage();
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "alpha" },
      });
      // Advance debounce
      act(() => vi.advanceTimersByTime(300));
      fireEvent.click(screen.getByText("Next page"));
      expect(mockFetchOrganizations).toHaveBeenLastCalledWith(2, "alpha");
    });
  });

  describe("create organization modal", () => {
    it("is closed by default", () => {
      setupMocks();
      renderPage();
      expect(
        screen.queryByRole("dialog", { name: "create-org" }),
      ).not.toBeInTheDocument();
    });

    it("opens when header New organization button clicked", () => {
      setupMocks();
      renderPage();
      const buttons = screen.getAllByRole("button", {
        name: /New organization/i,
      });
      fireEvent.click(buttons[0]);
      expect(
        screen.getByRole("dialog", { name: "create-org" }),
      ).toBeInTheDocument();
    });

    it("closes on modal close button click", () => {
      setupMocks();
      renderPage();
      fireEvent.click(
        screen.getAllByRole("button", { name: /New organization/i })[0],
      );
      fireEvent.click(screen.getByText("Close"));
      expect(
        screen.queryByRole("dialog", { name: "create-org" }),
      ).not.toBeInTheDocument();
    });

    it("calls fetchOrganizations after org created", () => {
      setupMocks({ orgs: [mockOrg], page: 2 });
      renderPage();
      fireEvent.click(
        screen.getAllByRole("button", { name: /New organization/i })[0],
      );
      fireEvent.click(screen.getByText("Create"));
      expect(mockFetchOrganizations).toHaveBeenLastCalledWith(2, undefined);
    });

    it("opens via empty-state New organization button", () => {
      setupMocks({ orgs: [], total: 0 });
      renderPage();
      const buttons = screen.getAllByRole("button", {
        name: /New organization/i,
      });
      fireEvent.click(buttons[buttons.length - 1]);
      expect(
        screen.getByRole("dialog", { name: "create-org" }),
      ).toBeInTheDocument();
    });
  });
});
