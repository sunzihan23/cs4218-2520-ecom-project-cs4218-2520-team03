// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import UserMenu from "./UserMenu";
import { MemoryRouter } from "react-router-dom";

describe("UserMenu Component", () => {

    const usermenu = <MemoryRouter><UserMenu /></MemoryRouter>;

    it("renders page heading", () => {
        const { getByText } = render(usermenu);
        expect(getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders profile link correctly", () => {
        const { getByRole } = render(usermenu);
        const link = getByRole("link", { name: "Profile" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/dashboard/user/profile");
    });

    it("renders orders link correctly", () => {
        const { getByRole } = render(usermenu);
        const link = getByRole("link", { name: "Orders" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/dashboard/user/orders");
    });

});