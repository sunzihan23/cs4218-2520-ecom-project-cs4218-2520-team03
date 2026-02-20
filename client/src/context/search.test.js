// Chen Peiran, A0257826R
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { SearchProvider, useSearch } from "./search";

describe("SearchContext", () => {

    const Consumer = () => {
        const [search, setSearch] = useSearch();

        return (
            <div>
                <div data-testid="keyword">{search.keyword}</div>
                <div data-testid="results-count">{search.results.length}</div>

                <button onClick={() =>
                    setSearch({ ...search, keyword: "book", results: [{ _id: "1" }] })
                }>
                    Update Search
                </button>
            </div>
        );
    };

    it("provides default values", () => {
        const { getByTestId } = render(<SearchProvider><Consumer /></SearchProvider>);
        expect(getByTestId("keyword")).toHaveTextContent("");
        expect(getByTestId("results-count")).toHaveTextContent("0");
    });

    it("allows updates to values", () => {
        const { getByTestId, getByText } = render(<SearchProvider><Consumer /></SearchProvider>);
        fireEvent.click(getByText("Update Search"));

        expect(getByTestId("keyword")).toHaveTextContent("book");
        expect(getByTestId("results-count")).toHaveTextContent("1");
    });

});