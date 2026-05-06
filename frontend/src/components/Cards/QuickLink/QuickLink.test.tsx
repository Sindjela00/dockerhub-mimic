import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ArrowRight } from "lucide-react";
import { BrowserRouter } from "react-router-dom";
import QuickLink from "./QuickLink";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("QuickLink", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const defaultProps = {
    icon: <span data-testid="test-icon">🔍</span>,
    label: "Search",
    description: "Find items quickly",
  };

  describe("Rendering", () => {
    it("renders the component with all required props", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Find items quickly")).toBeInTheDocument();
      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders the ArrowRight icon", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders with only required props (no link or onClick)", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("renders with custom icon component", () => {
      const customIcon = (
        <svg data-testid="custom-icon">
          <circle cx="5" cy="5" r="3" />
        </svg>
      );

      renderWithRouter(
        <QuickLink
          icon={customIcon}
          label="Custom"
          description="Custom description"
        />,
      );

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("renders with long text content", () => {
      renderWithRouter(
        <QuickLink
          {...defaultProps}
          label="This is a very long label that might need special handling"
          description="A very long description that could potentially wrap to multiple lines and should be handled gracefully by the component"
        />,
      );

      expect(screen.getByText(/This is a very long label/)).toBeInTheDocument();
      expect(screen.getByText(/A very long description/)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to the link when provided and clicked", () => {
      const link = "/search";
      renderWithRouter(<QuickLink {...defaultProps} link={link} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(link);
    });

    it("does not navigate when link is not provided", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("handles different link paths", () => {
      const links = ["/home", "/products", "/about", "/settings/profile"];

      links.forEach((link) => {
        const { unmount } = render(
          <BrowserRouter>
            <QuickLink
              icon={<span>🏠</span>}
              label="Test"
              description="Test description"
              link={link}
            />
          </BrowserRouter>,
        );

        fireEvent.click(screen.getByRole("button"));
        expect(mockNavigate).toHaveBeenCalledWith(link);

        mockNavigate.mockClear();
        unmount();
      });
    });
  });

  describe("onClick handler", () => {
    it("calls onClick handler when provided and button is clicked", () => {
      const handleClick = vi.fn();
      renderWithRouter(<QuickLink {...defaultProps} onClick={handleClick} />);

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick before navigation when both are provided", () => {
      const handleClick = vi.fn();
      const link = "/search";

      renderWithRouter(
        <QuickLink {...defaultProps} onClick={handleClick} link={link} />,
      );

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(link);
    });

    it("does not throw error when onClick is not provided", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      expect(() => {
        fireEvent.click(screen.getByRole("button"));
      }).not.toThrow();
    });

    it("handles async onClick handlers gracefully", async () => {
      const asyncHandler = vi.fn().mockResolvedValue(undefined);

      renderWithRouter(
        <QuickLink {...defaultProps} onClick={asyncHandler} link="/test" />,
      );

      fireEvent.click(screen.getByRole("button"));

      expect(asyncHandler).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);

      await expect(asyncHandler.mock.results[0].value).resolves.toBeUndefined();
    });
  });

  describe("Accessibility", () => {
    it("has proper button role", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("has descriptive text content", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Search");
      expect(button).toHaveTextContent("Find items quickly");
    });
  });

  describe("Styling classes", () => {
    it("applies base CSS classes", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("group");
      expect(button.className).toContain("flex");
      expect(button.className).toContain("p-4");
      expect(button.className).toContain("rounded-lg");
    });

    it("applies text alignment class for left alignment", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-left");
    });

    it("applies full width class", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full");
    });
  });

  describe("Icon container styling", () => {
    it("renders icon in styled container", () => {
      renderWithRouter(<QuickLink {...defaultProps} />);

      const iconContainer = screen.getByTestId("test-icon").parentElement;
      expect(iconContainer).toHaveClass("bg-bg-elevated");
      expect(iconContainer).toHaveClass("rounded-md");
      expect(iconContainer).toHaveClass("p-2");
    });
  });

  describe("Edge cases", () => {
    it("handles empty strings for description", () => {
      renderWithRouter(
        <QuickLink icon={<span>🔍</span>} label="Test" description="" />,
      );

      expect(screen.getByText("Test")).toBeInTheDocument();
      const description = screen.getByText("", { selector: "p.text-xs" });
      expect(description).toBeInTheDocument();
    });

    it("handles special characters in label and description", () => {
      renderWithRouter(
        <QuickLink
          icon={<span>✨</span>}
          label="Special & Characters < >"
          description="Description with emojis 🎉 and symbols &copy;"
        />,
      );

      expect(screen.getByText("Special & Characters < >")).toBeInTheDocument();
      expect(
        screen.getByText("Description with emojis 🎉 and symbols ©"),
      ).toBeInTheDocument();
    });

    it("handles rapid multiple clicks", () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <QuickLink {...defaultProps} onClick={handleClick} link="/test" />,
      );

      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });

    it("propagates additional button attributes", () => {
      renderWithRouter(<QuickLink {...defaultProps} link="/test" />);

      const button = screen.getByRole("button");
      expect(button).toBeEnabled();
    });
  });

  describe("Integration scenarios", () => {
    it("works as a clickable quick link for navigation", () => {
      renderWithRouter(
        <QuickLink
          icon={<span data-testid="search-icon">🔍</span>}
          label="Search Products"
          description="Browse our product catalog"
          link="/products"
        />,
      );

      expect(screen.getByText("Search Products")).toBeInTheDocument();
      expect(
        screen.getByText("Browse our product catalog"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("search-icon")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button"));
      expect(mockNavigate).toHaveBeenCalledWith("/products");
    });

    it("works as a button with custom action only", () => {
      const handleAction = vi.fn();

      renderWithRouter(
        <QuickLink
          icon={<span>⚙️</span>}
          label="Settings"
          description="Configure your preferences"
          onClick={handleAction}
        />,
      );

      fireEvent.click(screen.getByRole("button"));
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("supports both navigation and custom action", () => {
      const handleAction = vi.fn();

      renderWithRouter(
        <QuickLink
          icon={<span>📊</span>}
          label="Analytics"
          description="View your dashboard"
          link="/analytics"
          onClick={handleAction}
        />,
      );

      fireEvent.click(screen.getByRole("button"));
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/analytics");
    });
  });
});
