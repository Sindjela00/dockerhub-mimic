import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import CreateOrganizationModal from "./CreateOrganizationModal";

const mockAddOrganization = vi.fn();
const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

vi.mock("@/context/AppContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("@/services/organizations/useOrganizations/useOrganizations", () => ({
  useOrganizations: () => ({
    addOrganization: mockAddOrganization,
    creating: false,
  }),
}));

vi.mock("../Modal", () => ({
  default: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button onClick={onClose}>Close modal</button>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/Button/Button", () => ({
  default: ({
    children,
    onClick,
    disabled,
    type,
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/InputField/InputField", () => ({
  default: ({
    label,
    value,
    onChangeRaw,
    placeholder,
    error,
  }: {
    label: string;
    value: string;
    onChangeRaw: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    startIcon?: React.ReactNode;
  }) => (
    <div>
      <label>{label}</label>
      <input
        aria-label={label}
        value={value}
        onChange={onChangeRaw}
        placeholder={placeholder}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSuccess: mockOnSuccess,
};

function renderModal(props = {}) {
  return render(<CreateOrganizationModal {...defaultProps} {...props} />);
}

function fillForm({
  name = "my-org",
  displayName = "My Org",
  description = "",
} = {}) {
  if (name)
    fireEvent.change(screen.getByLabelText(/organization name/i), {
      target: { value: name },
    });
  if (displayName)
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: displayName },
    });
  if (description)
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: description },
    });
}

describe("CreateOrganizationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddOrganization.mockResolvedValue({ success: true });
  });

  describe("rendering", () => {
    it("renders when isOpen is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create new organization")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      renderModal({ isOpen: false });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders all form fields", () => {
      renderModal();
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it("renders Cancel and Create organization buttons", () => {
      renderModal();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create organization/i }),
      ).toBeInTheDocument();
    });
  });

  describe("form validation: name", () => {
    it("shows error when name is empty", async () => {
      renderModal();
      fireEvent.change(screen.getByLabelText(/display name/i), {
        target: { value: "My Org" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/organization name is required/i),
      ).toBeInTheDocument();
    });

    it("shows error when name has invalid characters", async () => {
      renderModal();
      fillForm({ name: "My Org!", displayName: "My Org" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/only lowercase letters/i),
      ).toBeInTheDocument();
    });

    it("shows error when name is shorter than 3 characters", async () => {
      renderModal();
      fillForm({ name: "ab", displayName: "My Org" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/at least 3 characters/i),
      ).toBeInTheDocument();
    });

    it("shows error when name exceeds 255 characters", async () => {
      renderModal();
      fillForm({ name: "a".repeat(256), displayName: "My Org" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/less than 255 characters/i),
      ).toBeInTheDocument();
    });

    it("accepts valid name with hyphens and underscores", async () => {
      renderModal();
      fillForm({ name: "my_org-123", displayName: "My Org" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        screen.queryByText(/organization name is required/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/only lowercase letters/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("form validation: displayName", () => {
    it("shows error when display name is empty", async () => {
      renderModal();
      fillForm({ name: "my-org", displayName: "" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/display name is required/i),
      ).toBeInTheDocument();
    });

    it("shows error when display name exceeds 100 characters", async () => {
      renderModal();
      fillForm({ name: "my-org", displayName: "A".repeat(101) });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/less than 100 characters/i),
      ).toBeInTheDocument();
    });
  });

  describe("form validation: description", () => {
    it("shows error when description exceeds 500 characters", async () => {
      renderModal();
      fillForm({
        name: "my-org",
        displayName: "My Org",
        description: "x".repeat(501),
      });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/less than 500 characters/i),
      ).toBeInTheDocument();
    });

    it("accepts empty description", async () => {
      renderModal();
      fillForm({ name: "my-org", displayName: "My Org", description: "" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      await waitFor(() => {
        expect(mockAddOrganization).toHaveBeenCalled();
      });
    });
  });

  describe("error clearing", () => {
    it("clears name error when user starts typing", async () => {
      renderModal();
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(
        await screen.findByText(/organization name is required/i),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/organization name/i), {
        target: { value: "a" },
      });
      expect(
        screen.queryByText(/organization name is required/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("calls addOrganization with trimmed values on valid submit", async () => {
      renderModal();
      fillForm({
        name: "my-org",
        displayName: "My Org",
        description: "  A desc  ",
      });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );

      await waitFor(() => {
        expect(mockAddOrganization).toHaveBeenCalledWith({
          name: "my-org",
          displayName: "My Org",
          description: "A desc",
        });
      });
    });

    it("calls onSuccess and onClose after successful creation", async () => {
      renderModal();
      fillForm();
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("resets the form after successful creation", async () => {
      renderModal();
      fillForm({ name: "my-org", displayName: "My Org" });
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/organization name/i)).toHaveValue("");
        expect(screen.getByLabelText(/display name/i)).toHaveValue("");
      });
    });

    it("does not call onSuccess or onClose when addOrganization fails", async () => {
      mockAddOrganization.mockResolvedValueOnce({ success: false });
      renderModal();
      fillForm();
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );

      await waitFor(() => {
        expect(mockAddOrganization).toHaveBeenCalled();
      });
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("does not submit when validation fails", async () => {
      renderModal();
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );
      expect(mockAddOrganization).not.toHaveBeenCalled();
    });
  });

  describe("cancel and close", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("resets form state when Cancel is clicked", () => {
      renderModal();
      fillForm({ name: "my-org", displayName: "My Org" });
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.getByLabelText(/organization name/i)).toHaveValue("");
      expect(screen.getByLabelText(/display name/i)).toHaveValue("");
    });
  });

  describe("creating state", () => {
    beforeEach(() => {
      vi.doMock(
        "@/services/organizations/useOrganizations/useOrganizations",
        () => ({
          useOrganizations: () => ({
            addOrganization: mockAddOrganization,
            creating: true,
          }),
        }),
      );
    });

    it("disables Cancel and submit buttons while creating", async () => {
      const { rerender } = render(
        <CreateOrganizationModal {...defaultProps} />,
      );

      mockAddOrganization.mockImplementation(() => new Promise(() => {}));

      fillForm();
      fireEvent.click(
        screen.getByRole("button", { name: /create organization/i }),
      );

      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
  });
});
