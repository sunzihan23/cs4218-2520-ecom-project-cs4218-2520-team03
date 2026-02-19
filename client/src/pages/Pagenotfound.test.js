// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Pagenotfound from "./Pagenotfound";
import { MemoryRouter } from "react-router-dom";

jest.mock("./../components/Layout", () =>
    ({ children }) => <div>{children}</div>
);

describe("Pagenotfound Component", () => {

    const pagenotfound = <MemoryRouter><Pagenotfound /></MemoryRouter>;

    it("renders page title", () => {
        const { getByText } = render(pagenotfound);
        expect(getByText("404")).toBeInTheDocument();
    });

    it("renders page heading", () => {
        const { getByText } = render(pagenotfound);
        expect(getByText("Oops ! Page Not Found")).toBeInTheDocument();
    });

    it("renders link correctly", () => {
        const { getByRole } = render(pagenotfound);
        const link = getByRole("link", { name: "Go Back" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/");
    });

});