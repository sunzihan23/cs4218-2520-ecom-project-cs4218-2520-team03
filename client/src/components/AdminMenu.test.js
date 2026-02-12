import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";

describe("Admin Menu Component", () => {
  test("renders admin panel heading", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /admin panel/i }),
    ).toBeInTheDocument();
  });

  test("renders all admin navigation links with correct routes", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    const links = [
      { text: "Create Category", href: "/dashboard/admin/create-category" },
      { text: "Create Product", href: "/dashboard/admin/create-product" },
      { text: "Products", href: "/dashboard/admin/products" },
      { text: "Orders", href: "/dashboard/admin/orders" },
    ];

    for (const { text, href } of links) {
      const link = screen.getByRole("link", { name: text });
      expect(link).toHaveAttribute("href", href);
    }
  });

  test("does not show Users link (commented out)", () => {
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", { name: /users/i }),
    ).not.toBeInTheDocument();
  });
});
