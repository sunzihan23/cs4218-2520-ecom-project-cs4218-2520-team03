// Chen Peiran, A0257826R
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Search from "./Search";
import { useSearch } from "../context/search";

jest.mock("../context/search", () => ({
    useSearch: jest.fn(),
}));
const setValues = jest.fn();

jest.mock("./../components/Layout", () => ({ children }) => (<div>{children}</div>));

describe("Search Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it("displays 'No Products Found' when no results found", () => {
        useSearch.mockReturnValue([{ keyword: "exists", results: [] }, setValues]);

        const { getByText } = render(<Search />);
        expect(getByText("No Products Found")).toBeInTheDocument();
    });

    it("displays correct number of results found", () => {
        const values = {
            keyword: "exists",
            results: [
                {
                    name: "Existing Product",
                    description: "Product Description",
                },
                {
                    name: "Existing Product 2",
                    description: "Product Description 2",
                }
            ]
        };
        useSearch.mockReturnValue([values, setValues]);

        const { getByText } = render(<Search />);
        expect(getByText("Found 2")).toBeInTheDocument();
    });

    it("correctly displays search results when results are found", () => {
        const mockValues = {
            keyword: "exists",
            results: [{
                _id: "1",
                name: "Existing Product",
                description: "product is good",
                price: 50
            }]
        };
        useSearch.mockReturnValue([mockValues, setValues]);

        const { getByText, getByRole } = render(<Search />);
        const image = getByRole("img", { name: "Existing Product" });

        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/1");

        expect(getByText("Existing Product")).toBeInTheDocument();
        expect(getByText("product is good...")).toBeInTheDocument();
        expect(getByText("$ 50")).toBeInTheDocument();

        expect(getByText("More Details")).toBeInTheDocument();
        expect(getByText("ADD TO CART")).toBeInTheDocument();
    });

});