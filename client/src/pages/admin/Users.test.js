import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";

jest.mock("../../components/Layout", () => {
  return function MockLayout({ title, children }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

jest.mock("../../components/AdminMenu", () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">AdminMenu</div>;
  };
});

describe("<Users />", () => {
  test("renders Layout with the correct title", () => {
    render(<Users />);

    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-title", "Dashboard - All Users");
  });

  test("renders the AdminMenu", () => {
    render(<Users />);
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  test('renders the "All Users" heading', () => {
    render(<Users />);
    expect(
      screen.getByRole("heading", { name: /all users/i, level: 1 }),
    ).toBeInTheDocument();
  });

  test("includes the main layout container classes", () => {
    const { container } = render(<Users />);

    expect(container.querySelector(".container-fluid.m-3.p-3")).toBeTruthy();
    expect(container.querySelector(".row")).toBeTruthy();
    expect(container.querySelector(".col-md-3")).toBeTruthy();
    expect(container.querySelector(".col-md-9")).toBeTruthy();
  });
});
