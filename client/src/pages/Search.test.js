// Chen Peiran, A0257826R
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Search from "./Search";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";

jest.mock("../context/search", () => ({
    useSearch: jest.fn(),
}));
const mockSetValues = jest.fn();

jest.mock("../context/cart", () => ({
    useCart: jest.fn(),
}));
const mockSetCart = jest.fn();

jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock("./../components/Layout", () => ({ children }) => (<div>{children}</div>));

Object.defineProperty(window, "localStorage", {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
    },
    writable: true,
});

describe("Search Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCart.mockReturnValue([[, mockSetCart]]);
    });

    it("displays correctly when no results found", () => {
        useSearch.mockReturnValue([{ keyword: "books", results: [] }, mockSetValues]);

        const { getByText } = render(<Search />);
        expect(getByText("No Products Found")).toBeInTheDocument();
    });

    it("displays correct number of results found", () => {
        const mockValues = {
            keyword: "books",
            results: [
                {
                    _id: "1",
                    name: "Book A",
                    description: "Description A",
                },
                {
                    _id: "2",
                    name: "Book B",
                    description: "Description B",
                }
            ]
        };
        useSearch.mockReturnValue([mockValues, mockSetValues]);

        const { getByText } = render(<Search />);
        expect(getByText("Found 2")).toBeInTheDocument();
    });

    it("displays search results when found", () => {
        const mockValues = {
            keyword: "books",
            results: [{
                _id: "1",
                name: "Book A",
                description: "Description A",
                price: 50
            }]
        };
        useSearch.mockReturnValue([mockValues, mockSetValues]);

        const { getByText, getByRole } = render(<Search />);
        const image = getByRole("img", { name: "Book A" });

        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/1");

        expect(getByText("Book A")).toBeInTheDocument();
        expect(getByText("Description A...")).toBeInTheDocument();
        expect(getByText("$ 50")).toBeInTheDocument();

        expect(getByText("More Details")).toBeInTheDocument();
        expect(getByText("ADD TO CART")).toBeInTheDocument();
    });

    it("navigates to the product page when 'More Details' is clicked", () => {
        const mockValues = {
            keyword: "books",
            results: [
                { _id: "1", name: "Book A", slug: "book-a", description: "Description A", price: 50 },
            ],
        };
        useSearch.mockReturnValue([mockValues, mockSetValues]);

        const mockSetCart = jest.fn();
        useCart.mockReturnValue([[], mockSetCart]);

        const { getByText } = render(<Search />);

        fireEvent.click(getByText("More Details"));
        expect(mockNavigate).toHaveBeenCalledWith("/product/book-a");
    });

    it("adds item to cart when 'ADD TO CART' is clicked", async () => {
        const mockProduct = {
            _id: "1",
            name: "Book A",
            slug: "book-a",
            description: "Description A",
            price: 50,
        };

        useSearch.mockReturnValue([{ keyword: "books", results: [mockProduct] }, mockSetValues]);

        const mockSetCart = jest.fn();
        useCart.mockReturnValue([[], mockSetCart]);

        const { getByText } = render(<Search />);

        await waitFor(() => {
            expect(getByText("ADD TO CART")).toBeInTheDocument()
        });
        fireEvent.click(getByText("ADD TO CART"));

        expect(mockSetCart).toHaveBeenCalledTimes(1);
        expect(mockSetCart).toHaveBeenCalledWith([
            expect.objectContaining({ _id: "1", name: "Book A" }),
        ]);
    });

    it("updates localStorage when 'ADD TO CART' is clicked", async () => {
        const mockProduct = {
            _id: "1",
            name: "Book A",
            slug: "book-a",
            description: "Description A",
            price: 50,
        };

        useSearch.mockReturnValue([{ keyword: "books", results: [mockProduct] }, mockSetValues]);

        const mockSetCart = jest.fn();
        useCart.mockReturnValue([[], mockSetCart]);

        const { getByText } = render(<Search />);

        await waitFor(() => {
            expect(getByText("ADD TO CART")).toBeInTheDocument()
        });
        fireEvent.click(getByText("ADD TO CART"));

        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "cart",
            expect.stringContaining("Book A")
        );
    });

    it("shows toast when 'ADD TO CART' is clicked", async () => {
        const mockProduct = {
            _id: "1",
            name: "Book A",
            slug: "book-a",
            description: "Description A",
            price: 50,
        };

        useSearch.mockReturnValue([{ keyword: "books", results: [mockProduct] }, mockSetValues]);

        const mockSetCart = jest.fn();
        useCart.mockReturnValue([[], mockSetCart]);

        const { getByText } = render(<Search />);

        await waitFor(() => {
            expect(getByText("ADD TO CART")).toBeInTheDocument()
        });
        fireEvent.click(getByText("ADD TO CART"));

        expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    });

});