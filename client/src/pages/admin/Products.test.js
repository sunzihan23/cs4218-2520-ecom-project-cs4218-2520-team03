import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products"; // ✅ adjust path

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
}));
jest.mock("./../../components/Layout", () => {
    return function MockLayout({ children }) {
        return <div data-testid="layout">{children}</div>;
    };
});
jest.mock("../../components/AdminMenu", () => {
    return function MockAdminMenu() {
        return <div data-testid="admin-menu">AdminMenu</div>;
    };
});
jest.mock("react-router-dom", () => ({
    Link: ({ to, children, ...rest }) => (
        <a href={to} {...rest}>
            {children}
        </a>
    ),
}));

describe("Admin Products page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const apiSuccess = {
        data: {
            products: [
                {
                    _id: "p1",
                    slug: "prod-1",
                    name: "Product One",
                    description: "Desc One",
                },
            ],
        },
    };

    test("calls get product api on mount", async () => {
        axios.get.mockResolvedValueOnce(apiSuccess);
        render(<Products />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
        });
    });
    test("renders a product name after successful fetch", async () => {
        axios.get.mockResolvedValueOnce(apiSuccess);
        render(<Products />);
        expect(await screen.findByText("Product One")).toBeInTheDocument();
    });
    test("renders a product description after successful fetch", async () => {
        axios.get.mockResolvedValueOnce(apiSuccess);
        render(<Products />);
        expect(await screen.findByText("Desc One")).toBeInTheDocument();
    });
    test("renders a link to the product admin page using slug", async () => {
        axios.get.mockResolvedValueOnce(apiSuccess);
        render(<Products />);
        const link = await screen.findByRole("link", { name: /product one/i });
        expect(link).toHaveAttribute("href", "/dashboard/admin/product/prod-1");
    });
    test("shows toast error when request fails", async () => {
        axios.get.mockRejectedValueOnce(new Error("admin product fail"));
        render(<Products />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
        });
    });
});
