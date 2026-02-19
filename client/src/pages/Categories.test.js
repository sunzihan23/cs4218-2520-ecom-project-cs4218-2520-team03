// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from 'react-router-dom';
import "@testing-library/jest-dom/extend-expect";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../components/Layout", () =>
    jest.fn(({ children }) => <div>{children}</div>)
);

jest.mock("../hooks/useCategory", () => jest.fn());

describe("Categories Component", () => {

    const categoriesMock = [
        { _id: "1", name: "Books", slug: "books" },
        { _id: "2", name: "Mobile Phones", slug: "mobile-phones" },
    ];

    const categories = <MemoryRouter><Categories /></MemoryRouter>;

    beforeEach(() => {
        jest.clearAllMocks();
        useCategory.mockReturnValue(categoriesMock);
    })

    it("renders category names", () => {
        const { getByText } = render(categories);
        expect(getByText("Books")).toBeInTheDocument();
        expect(getByText("Mobile Phones")).toBeInTheDocument();
    });

    it("renders no categories when given empty list", () => {
        useCategory.mockReturnValue([]);
        const { queryByRole } = render(categories);
        expect(queryByRole("link")).toBeNull();
    });

    it("renders links correctly for each category", () => {
        const { getByRole } = render(categories);
        const booksLink = getByRole("link", { name: "Books" });
        const phonesLink = getByRole("link", { name: "Mobile Phones" });

        expect(booksLink).toHaveAttribute("href", "/category/books");
        expect(phonesLink).toHaveAttribute("href", "/category/mobile-phones");

    });
});