//Chen Zhiruo A0256855N
import React from "react";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("axios");
jest.mock("../components/Layout", () => {
    return function MockLayout({ children }) {
        return <div data-testid="layout">{children}</div>;
    };
});
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    useParams: jest.fn(),
    useNavigate: () => mockNavigate,
}));

import { useParams } from "react-router-dom";

describe("CategoryProduct", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const apiResponseWithNoProducts = {
        data: {
            category: { _id: "c1", name: "mockCategory" },
            products: [],
        },
    };
    const apiResponseWithProducts = {
        data: {
            category: { _id: "c1", name: "mockCategory" },
            products: [
                {
                    _id: "p1",
                    slug: "mock-product",
                    name: "Mock Product",
                    description:
                        "A mock product description that is definitely longer than sixty characters for substring testing.",
                    price: 1999,
                },
            ],
        },
    };

    test("does not call API when params.slug is missing", async () => {
        useParams.mockReturnValue({});
        render(<CategoryProduct />);
        expect(axios.get).not.toHaveBeenCalled();
    });
    test("calls product-category endpoint when slug exists", async () => {
        useParams.mockReturnValue({ slug: "mockCategory" });
        axios.get.mockResolvedValueOnce(apiResponseWithNoProducts);
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                "/api/v1/product/product-category/mockCategory"
            );
        });
    });
    test("renders category name after loading", async () => {
        useParams.mockReturnValue({ slug: "mockCategory" });
        axios.get.mockResolvedValueOnce(apiResponseWithNoProducts);
        render(<CategoryProduct />);
        expect(await screen.findByText("Category - mockCategory")).toBeInTheDocument();
    });
    test("renders correct results count", async () => {
        useParams.mockReturnValue({ slug: "mockCategory" });
        axios.get.mockResolvedValueOnce(apiResponseWithProducts);
        render(<CategoryProduct />);
        expect(await screen.findByText("1 result found")).toBeInTheDocument();
    });
    test("renders a product name when products exist", async () => {
        useParams.mockReturnValue({ slug: "mockCategory" });
        axios.get.mockResolvedValueOnce(apiResponseWithProducts);
        render(<CategoryProduct />);
        expect(await screen.findByText("Mock Product")).toBeInTheDocument();
    });
    test("clicking 'More Details' navigates to product page", async () => {
        useParams.mockReturnValue({ slug: "mockCategory" });
        axios.get.mockResolvedValueOnce(apiResponseWithProducts);
        render(<CategoryProduct />);
        const btn = await screen.findByRole("button", { name: /more details/i });
        fireEvent.click(btn);
        expect(mockNavigate).toHaveBeenCalledWith("/product/mock-product");
    });
    test("logs error message when axios request fails", async () => {
        useParams.mockReturnValue({ slug: "mockCategory" });
        const err = new Error("category product fail");
        axios.get.mockRejectedValueOnce(err);
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        render(<CategoryProduct />);

        await waitFor(() => {
            expect(logSpy).toHaveBeenCalledWith("category product fail");
        });
        logSpy.mockRestore();
    });
});
