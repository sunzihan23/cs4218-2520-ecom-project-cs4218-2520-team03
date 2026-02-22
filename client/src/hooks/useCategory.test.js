// Chen Peiran, A0257826R
import React from "react";
import axios from "axios";
import useCategory from "./useCategory";
import { renderHook, waitFor } from "@testing-library/react";

jest.mock("axios");

describe("useCategory Hook", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns empty array initially that stays empty on [] return", async () => {
        axios.get.mockResolvedValueOnce({ data: { category: [] } });
        const { result } = renderHook(() => useCategory());

        expect(result.current).toEqual([]);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });
        expect(result.current).toEqual([]);
    });

    it("returns categories on successful API call", async () => {
        const mockCategories = [
            { "name": "Food", "slug": "food" },
            { "name": "Books", "slug": "books" },
        ];

        axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });
        const { result } = renderHook(() => useCategory());

        await waitFor(() => {
            expect(result.current).toEqual(mockCategories);
        });
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    it("returns empty array on error ", async () => {
        axios.get.mockRejectedValue(new Error("Error"));
        const { result } = renderHook(() => useCategory());

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });
        expect(result.current).toEqual([]);
    });

});