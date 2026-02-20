// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Footer from "./Footer";
import { MemoryRouter } from "react-router-dom";

describe("Footer Component", () => {

    const footer = <MemoryRouter><Footer /></MemoryRouter>;

    it("renders description text", () => {
        const { getByText } = render(footer);
        expect(getByText("All Rights Reserved © TestingComp")).toBeInTheDocument();
    });

    it("renders About link correctly", () => {
        const { getByRole } = render(footer);
        const aboutLink = getByRole("link", { name: "About" });
        expect(aboutLink).toBeInTheDocument();
        expect(aboutLink).toHaveAttribute("href", "/about");
    });

    it("renders Contact link correctly", () => {
        const { getByRole } = render(footer);
        const contactLink = getByRole("link", { name: "Contact" });
        expect(contactLink).toBeInTheDocument();
        expect(contactLink).toHaveAttribute("href", "/contact");
    });

    it("renders Privacy Policy link correctly", () => {
        const { getByRole } = render(footer);
        const policyLink = getByRole("link", { name: "Privacy Policy" });
        expect(policyLink).toBeInTheDocument();
        expect(policyLink).toHaveAttribute("href", "/policy");
    });

});