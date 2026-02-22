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
    });

    it("displays correctly when no results found", () => {
        useSearch.mockReturnValue([{ keyword: "books", results: [] }, setValues]);

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
        useSearch.mockReturnValue([mockValues, setValues]);

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
        useSearch.mockReturnValue([mockValues, setValues]);

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

});