//Chen Zhiruo A0256855N
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import ProductDetails from "./ProductDetails";

jest.mock("axios");
jest.mock("./../components/Layout", () => {
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

describe("ProductDetails", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const productApiResponse = {
        data: {
            product: {
                _id: "p1",
                slug: "single-mock-product",
                name: "Single Mock Product",
                description: "Single Mock Product",
                price: 1999,
                category: { _id: "c1", name: "mockCategory" },
            },
        },
    };
    const relatedApiResponseEmpty = {
        data: { products: [] },
    };
    const relatedApiResponseWithItems = {
        data: {
            products: [
                {
                    _id: "p2",
                    slug: "mock-related-product",
                    name: "Mock Related Product",
                    description:
                        "mock related product description that is definitely longer than sixty characters to test substring.",
                    price: 999,
                },
            ],
        },
    };

    test("does not call API when params.slug is missing", async () => {
        useParams.mockReturnValue({});
        render(<ProductDetails />);
        expect(axios.get).not.toHaveBeenCalled();
    });
    test("calls get-product endpoint when slug exists", async () => {
        useParams.mockReturnValue({ slug: "single-mock-product" });
        axios.get
            .mockResolvedValueOnce(productApiResponse)
            .mockResolvedValueOnce(relatedApiResponseEmpty);
        render(<ProductDetails />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                "/api/v1/product/get-product/single-mock-product"
            );
        });
    });
    test("renders product name after loading", async () => {
        useParams.mockReturnValue({ slug: "mock-single-product" });
        axios.get
            .mockResolvedValueOnce(productApiResponse)
            .mockResolvedValueOnce(relatedApiResponseEmpty);
        render(<ProductDetails />);
        expect(await screen.findByText("Name : Single Mock Product")).toBeInTheDocument();
    });
    test("shows 'No Similar Products found' when related products is empty", async () => {
        useParams.mockReturnValue({ slug: "single-mock-product" });
        axios.get
            .mockResolvedValueOnce(productApiResponse)
            .mockResolvedValueOnce(relatedApiResponseEmpty);
        render(<ProductDetails />);
        expect(
            await screen.findByText("No Similar Products found")
        ).toBeInTheDocument();
    });
    test("renders a related product card when related products exist", async () => {
        useParams.mockReturnValue({ slug: "single-mock-product" });
        axios.get
            .mockResolvedValueOnce(productApiResponse)
            .mockResolvedValueOnce(relatedApiResponseWithItems);
        render(<ProductDetails />);
        expect(await screen.findByText("Mock Related Product")).toBeInTheDocument();
    });
    test("clicking 'More Details' navigates to related product page", async () => {
        useParams.mockReturnValue({ slug: "single-mock-product" });
        axios.get
            .mockResolvedValueOnce(productApiResponse)
            .mockResolvedValueOnce(relatedApiResponseWithItems);
        render(<ProductDetails />);
        const btn = await screen.findByRole("button", { name: /more details/i });
        fireEvent.click(btn);
        expect(mockNavigate).toHaveBeenCalledWith("/product/mock-related-product");
    });
    test("logs error message when get product axios request fails", async () => {
        useParams.mockReturnValue({ slug: "single-mock-product" });
        const err = new Error("get product fail");
        axios.get.mockRejectedValueOnce(err);
        render(<ProductDetails />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled()
        });
    });
    test("logs error message when get related product axios request fails", async () => {
        useParams.mockReturnValue({ slug: "single-mock-product" });
        const err = new Error("get related product fail");
        axios.get
            .mockResolvedValueOnce(productApiResponse)
            .mockRejectedValueOnce(err);
        render(<ProductDetails />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled()
        });
    });
});
