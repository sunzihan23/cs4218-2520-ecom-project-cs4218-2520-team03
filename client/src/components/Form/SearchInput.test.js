// Chen Peiran, A0257826R
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import SearchInput from "./SearchInput";
import { useSearch } from "../../context/search";

jest.mock("axios");

jest.mock("../../context/search", () => ({
    useSearch: jest.fn()
}));

jest.mock("react-router-dom", () => ({
    useNavigate: jest.fn()
}));

const mockNavigate = jest.fn();
const mockSetValues = jest.fn();

describe("SearchInput Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        const mockValues = { keyword: "book", results: [] };
        useSearch.mockReturnValue([mockValues, mockSetValues]);
    });

    it("renders input and button", () => {
        useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);

        const { getByRole } = render(<SearchInput />);

        expect(getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
        expect(getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("renders input with the keyword from context", () => {
        const { getByRole } = render(<SearchInput />);
        const input = getByRole("searchbox", { name: "Search" });

        expect(input).toBeInTheDocument();
        expect(input).toHaveValue("book");
    });

    it("updates keyword in context", () => {
        const { getByRole } = render(<SearchInput />);
        const input = getByRole("searchbox", { name: "Search" });
        fireEvent.change(input, { target: { value: "phone" } });

        expect(mockSetValues).toHaveBeenCalledTimes(1);
        expect(mockSetValues).toHaveBeenCalledWith(expect.objectContaining({ keyword: "phone" }));
    });

    const mockResults = [
        { _id: "1", name: "Book A" },
        { _id: "2", name: "Book B" },
    ];

    it("calls API with given keyword", async () => {
        axios.get.mockResolvedValueOnce({ data: mockResults });
        const { getByRole } = render(<SearchInput />);
        fireEvent.click(getByRole("button", { name: "Search" }));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/book");
        });
    });

    it("updates results in context on submit", async () => {
        axios.get.mockResolvedValueOnce({ data: mockResults });
        const { getByRole } = render(<SearchInput />);
        fireEvent.click(getByRole("button", { name: "Search" }));

        await waitFor(() => {
            expect(mockSetValues).toHaveBeenCalledWith(expect.objectContaining({ results: mockResults }));
        });
    });

    it("navigates to /search after submit", async () => {
        axios.get.mockResolvedValueOnce({ data: mockResults });
        const { getByRole } = render(<SearchInput />);
        fireEvent.click(getByRole("button", { name: "Search" }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/search");
        });
    });

    it("does not navigate on failed API request", async () => {
        axios.get.mockRejectedValueOnce(new Error("Error"));
        const { getByRole } = render(<SearchInput />);
        fireEvent.click(getByRole("button", { name: "Search" }));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

});