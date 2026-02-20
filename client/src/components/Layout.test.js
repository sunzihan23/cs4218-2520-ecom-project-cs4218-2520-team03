// Chen Peiran, A0257826R
import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Layout from "./Layout";

jest.mock("./Footer", () =>
    () => <div>Footer</div>
);

jest.mock("./Header", () =>
    () => <div>Header</div>
);

jest.mock("react-hot-toast", () => ({
    Toaster: () => <div>Toaster</div>
}));

describe("Layout Component", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        document.title = "";
        document.head.innerHTML = "";
    });

    it("renders Header, Footer, Toaster, children", () => {
        const { getByText } = render(
            <Layout>
                <div>Children</div>
            </Layout>
        );

        expect(getByText("Header")).toBeInTheDocument();
        expect(getByText("Footer")).toBeInTheDocument();
        expect(getByText("Toaster")).toBeInTheDocument();
        expect(getByText("Children")).toBeInTheDocument();
    });

    it("uses default title when not provided", async () => {
        render(<Layout><div>Children</div></Layout>);

        await waitFor(() => {
            expect(document.title).toBe("Ecommerce app - shop now");
        })
    });

    it("uses default meta tags when not provided", async () => {
        render(<Layout><div>Children</div></Layout>);

        await waitFor(() => {
            const description = document.querySelector('meta[name="description"]');
            const keywords = document.querySelector('meta[name="keywords"]');
            const author = document.querySelector('meta[name="author"]');

            expect(description).toHaveAttribute("content", "mern stack project");
            expect(keywords).toHaveAttribute("content", "mern,react,node,mongodb");
            expect(author).toHaveAttribute("content", "Techinfoyt");
        });
    });

    it("uses provided title prop", async () => {
        render(<Layout title="Official Apple Store"><div>Children</div></Layout>);

        await waitFor(() => {
            expect(document.title).toBe("Official Apple Store");
        });
    });

    it("uses provided meta tags", async () => {
        render(<Layout
            description="fruits"
            keywords="apples, bananas"
            author="Bob">

            <div>Children</div>
        </Layout>);

        await waitFor(() => {
            const description = document.querySelector('meta[name="description"]');
            const keywords = document.querySelector('meta[name="keywords"]');
            const author = document.querySelector('meta[name="author"]');

            expect(description).toHaveAttribute("content", "fruits");
            expect(keywords).toHaveAttribute("content", "apples, bananas");
            expect(author).toHaveAttribute("content", "Bob");
        });
    })

});