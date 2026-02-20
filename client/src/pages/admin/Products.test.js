import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

//Chen Zhiruo A0256855N
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

    const page1Response = {
        data: {
            page: 1,
            perPage: 12,
            total: 13,
            products: [
                { _id: "p1", slug: "prod-1", name: "Product One", description: "Desc One" },
            ],
        },
    };
    const page2Response = {
        data: {
            page: 2,
            perPage: 12,
            total: 13,
            products: [
                { _id: "p2", slug: "prod-2", name: "Product Two", description: "Desc Two" },
            ],
        },
    };
    test("calls get product api with params on mount", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product", {
                params: { page: 1, perPage: 12 },
            });
        });
    });
    test("renders a product name after successful fetch", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        expect(await screen.findByText("Product One")).toBeInTheDocument();
    });
    test("renders a product description after successful fetch", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        expect(await screen.findByText("Desc One")).toBeInTheDocument();
    });
    test("renders a link to the product admin page using slug", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        const link = await screen.findByRole("link", { name: /product one/i });
        expect(link).toHaveAttribute("href", "/dashboard/admin/product/prod-1");
    });
    test("renders page indicator text from response", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    });
    test("Previous button is disabled on page 1", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        await screen.findByText("Page 1 of 2");
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });
    test("Next button is enabled on page 1 when there is another page", async () => {
        axios.get.mockResolvedValueOnce(page1Response);
        render(<Products />);
        await screen.findByText("Page 1 of 2");
        expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
    });
    test("clicking Next fetches page 2", async () => {
        axios.get
            .mockResolvedValueOnce(page1Response)
            .mockResolvedValueOnce(page2Response);
        render(<Products />);
        await screen.findByText("Page 1 of 2");
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product", {
                params: { page: 2, perPage: 12 },
            });
        });
    });
    test("Prev button is enabled on page 2", async () => {
        axios.get
            .mockResolvedValueOnce(page1Response)
            .mockResolvedValueOnce(page2Response);
        render(<Products />);
        await screen.findByText("Page 1 of 2");
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        await screen.findByText("Page 2 of 2");
        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    });
    test("clicking Prev fetches page 1", async () => {
        axios.get
            .mockResolvedValueOnce(page1Response)
            .mockResolvedValueOnce(page2Response);
        render(<Products />);
        await screen.findByText("Page 1 of 2");
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        await screen.findByText("Page 2 of 2");
        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product", {
                params: { page: 1, perPage: 12 },
            });
        });
    });
    test("shows toast error when request fails", async () => {
        axios.get.mockRejectedValueOnce(new Error("admin product fail"));
        render(<Products />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
        });
    });
});
