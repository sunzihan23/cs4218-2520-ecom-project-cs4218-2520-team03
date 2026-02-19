import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Header from "./Header";
import { MemoryRouter } from "react-router-dom";

// Mocks for child component and external libs
jest.mock("./Form/SearchInput", () => () => <div data-testid="search-input" />);
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));

// Mock antd Badge to a simple wrapper that exposes count for assertions
jest.mock("antd", () => ({
  Badge: ({ count, children, showZero }) => (
    <div data-testid="badge" data-count={count} data-showzero={showZero}>
      {children}
    </div>
  ),
}));

// Mock hooks used by Header
const mockUseAuth = jest.fn();
const mockUseCart = jest.fn();
const mockUseCategory = jest.fn();

jest.mock("../context/auth", () => ({ useAuth: () => mockUseAuth() }));
jest.mock("../context/cart", () => ({ useCart: () => mockUseCart() }));
jest.mock("../hooks/useCategory", () => ({ __esModule: true, default: () => mockUseCategory() }));

import toast from "react-hot-toast";

const renderHeader = () => render(
  <MemoryRouter>
    <Header />
  </MemoryRouter>
);

describe("Header Component", () => {
  const setAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // default mocks
    mockUseAuth.mockReturnValue([{ user: null, token: "" }, setAuth]);
    mockUseCart.mockReturnValue([[]]);
    mockUseCategory.mockReturnValue([]);
  });

  it("renders brand link to home", () => {
    renderHeader();
    const brand = screen.getByRole("link", { name: /virtual vault/i });
    expect(brand).toBeInTheDocument();
    expect(brand).toHaveAttribute("href", "/");
  });

  it("shows Register and Login when user is not authenticated", () => {
    mockUseAuth.mockReturnValue([{ user: null, token: "" }, setAuth]);
    renderHeader();

    const register = screen.getByRole("link", { name: /register/i });
    const login = screen.getByRole("link", { name: /login/i });

    expect(register).toBeInTheDocument();
    expect(register).toHaveAttribute("href", "/register");
    expect(login).toBeInTheDocument();
    expect(login).toHaveAttribute("href", "/login");
  });

  it("shows user dropdown and dashboard/logout when authenticated (user role)", () => {
    mockUseAuth.mockReturnValue([{ user: { name: "Alice", role: 0 }, token: "t" }, setAuth]);
    renderHeader();

    // user name is visible
    expect(screen.getByText("Alice")).toBeInTheDocument();

    // dashboard path for user role
    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/dashboard/user");

    // logout present and triggers side effects
    const logout = screen.getByRole("link", { name: /logout/i });

    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");
    fireEvent.click(logout);

    expect(setAuth).toHaveBeenCalledWith({ user: null, token: "" });
    expect(removeItemSpy).toHaveBeenCalledWith("auth");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  it("sets dashboard path to admin when role is admin", () => {
    mockUseAuth.mockReturnValue([{ user: { name: "Admin", role: 1 }, token: "t" }, setAuth]);
    renderHeader();

    const dashboard = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/dashboard/admin");
  });

  it("renders Categories dropdown with All Categories and dynamic category links", () => {
    mockUseCategory.mockReturnValue([
      { name: "Shoes", slug: "shoes" },
      { name: "Hats", slug: "hats" },
    ]);
    renderHeader();

    const all = screen.getByRole("link", { name: "All Categories" });
    expect(all).toHaveAttribute("href", "/categories");

    const shoes = screen.getByRole("link", { name: "Shoes" });
    const hats = screen.getByRole("link", { name: "Hats" });
    expect(shoes).toHaveAttribute("href", "/category/shoes");
    expect(hats).toHaveAttribute("href", "/category/hats");
  });

  it("renders SearchInput component", () => {
    renderHeader();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("shows cart badge with correct item count", () => {
    mockUseCart.mockReturnValue([[{ id: 1 }, { id: 2 }, { id: 3 }]]);
    renderHeader();

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-count", "3");

    // Cart link still present
    const cartLink = screen.getByRole("link", { name: /cart/i });
    expect(cartLink).toHaveAttribute("href", "/cart");
  });
});
