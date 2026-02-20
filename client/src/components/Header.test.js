// Chen Peiran, A0257826R
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Header from "./Header";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import { MemoryRouter } from "react-router-dom";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn()
}));
const mockSetAuth = jest.fn();

jest.mock("../context/cart", () => ({
  useCart: jest.fn()
}));

jest.mock("../hooks/useCategory", () => jest.fn());

jest.mock("./Form/SearchInput", () =>
  () => <div>SearchInput</div>
);

jest.mock("react-hot-toast", () => ({ success: jest.fn() }));


describe("Header Component", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: null, token: "" }, mockSetAuth]);
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([]);
  })

  const header = <MemoryRouter><Header /></MemoryRouter>;

  it("renders all main links correctly", () => {
    const { getByRole } = render(header);

    expect(getByRole("link", { name: "🛒 Virtual Vault" })).toHaveAttribute("href", "/");
    expect(getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(getByRole("link", { name: "Categories" })).toHaveAttribute("href", "/categories");
    expect(getByRole("link", { name: "All Categories" })).toHaveAttribute("href", "/categories");
    expect(getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/cart");

  });

  it("renders SearchInput component", () => {
    const { getByText } = render(header);
    expect(getByText("SearchInput")).toBeInTheDocument();
  });

  it("renders correct navlinks for unauthenticated users", () => {
    const { getByRole } = render(header);
    const registerLink = getByRole("link", { name: "Register" });
    const loginLink = getByRole("link", { name: "Login" });

    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("renders correct dashboard link for authenticated users", () => {
    useAuth.mockReturnValue([{ user: { name: "user1", role: 0 }, token: "mock-token" },
      mockSetAuth]);

    const { getByRole, getByText } = render(header);
    const dashboardLink = getByRole("link", { name: "Dashboard" });
    const logoutLink = getByRole("link", { name: "Logout" });

    expect(getByText("user1")).toBeInTheDocument();
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
    expect(logoutLink).toBeInTheDocument();
    expect(logoutLink).toHaveAttribute("href", "/login");
  });

  it("renders correct links when role not provided", () => {
    useAuth.mockReturnValue([{ user: { name: "user1" }, token: "mock-token" },
      mockSetAuth]);

    const { getByRole, getByText } = render(header);
    const dashboardLink = getByRole("link", { name: "Dashboard" });
    const logoutLink = getByRole("link", { name: "Logout" });

    expect(getByText("user1")).toBeInTheDocument();
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
    expect(logoutLink).toBeInTheDocument();
    expect(logoutLink).toHaveAttribute("href", "/login");

  });

  it("renders correct links for admin users", () => {
    useAuth.mockReturnValue([{ user: { name: "admin1", role: 1 }, token: "mock-token" },
      mockSetAuth]);

    const { getByRole, getByText } = render(header);
    const dashboardLink = getByRole("link", { name: "Dashboard" });
    const logoutLink = getByRole("link", { name: "Logout" });

    expect(getByText("admin1")).toBeInTheDocument();
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
    expect(logoutLink).toBeInTheDocument();
    expect(logoutLink).toHaveAttribute("href", "/login");

  });

  it("calls handleLogout when logout link is clicked", () => {
    useAuth.mockReturnValue([{ user: { name: "user1", role: 0 }, token: "mock-token" },
      mockSetAuth]);

    render(header);

    fireEvent.click(screen.getByRole("link", { name: "Logout" }));

    expect(mockSetAuth).toHaveBeenCalledWith({ user: null, token: "" });
  });

  it("renders categories correctly", () => {
    const mockCategories = [
      { name: "Books", slug: "books" },
      { name: "Mobile Phones", slug: "mobile-phones" },
    ];
    useCategory.mockReturnValue(mockCategories);

    const { getByRole } = render(header);
    const bookLink = getByRole("link", { name: "Books" });
    const phoneLink = getByRole("link", { name: "Mobile Phones" });

    expect(bookLink).toBeInTheDocument();
    expect(bookLink).toHaveAttribute("href", "/category/books");
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute("href", "/category/mobile-phones");
  });

  it("renders correct cart count", () => {
    useCart.mockReturnValue([[{ id: 1 }, { id: 2 }, { id: 3 }]]);

    const { getByText } = render(header);

    expect(getByText("Cart")).toBeInTheDocument();
    expect(getByText("3")).toBeInTheDocument();
  });

});
