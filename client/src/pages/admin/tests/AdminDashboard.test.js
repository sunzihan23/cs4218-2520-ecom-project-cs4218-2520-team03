import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "../AdminDashboard"; // adjust relative path as needed

// ✅ Mock AdminMenu so tests don't depend on its implementation
jest.mock("../../../components/AdminMenu", () => () => (
  <nav data-testid="admin-menu">AdminMenu</nav>
));

// ✅ Mock Layout so tests don't depend on its implementation
jest.mock("../../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// ✅ Mock useAuth hook
jest.mock("../../../context/auth", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "../../../context/auth";

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders layout and admin menu", () => {
    useAuth.mockReturnValue([
      {
        user: { name: "Alice", email: "alice@test.com", phone: "12345" },
      },
    ]);

    render(<AdminDashboard />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  test("shows admin user details when auth user exists", () => {
    useAuth.mockReturnValue([
      {
        user: { name: "Alice", email: "alice@test.com", phone: "12345" },
      },
    ]);

    render(<AdminDashboard />);

    expect(screen.getByText(/Admin Name\s*:\s*Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email\s*:\s*alice@test\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact\s*:\s*12345/i)).toBeInTheDocument();
  });

  test("does not crash and renders labels if auth is missing user fields", () => {
    // auth exists but user is missing (optional chaining should prevent crash)
    useAuth.mockReturnValue([{}]);

    render(<AdminDashboard />);

    // The headings render, but values are blank/undefined
    expect(screen.getByText(/Admin Name\s*:/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email\s*:/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact\s*:/i)).toBeInTheDocument();
  });

  test("does not crash if useAuth returns [null]", () => {
    useAuth.mockReturnValue([null]);

    render(<AdminDashboard />);

    expect(screen.getByText(/Admin Name\s*:/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email\s*:/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact\s*:/i)).toBeInTheDocument();
  });
});
