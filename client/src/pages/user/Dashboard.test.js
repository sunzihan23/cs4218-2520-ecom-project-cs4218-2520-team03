// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";

jest.mock("../../components/Layout", () =>
    ({ children }) => <div>{children}</div>
);

jest.mock("../../components/UserMenu", () =>
    () => <div>UserMenu</div>
);

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn()
}));

describe("Dashboard Component", () => {

    const mockUser = {
        user: {
            name: "Bob",
            email: "bob@gmail.com",
            address: "Bobby Street"
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue([mockUser]);
    });

    it("renders user name", () => {
        const { getByText } = render(<Dashboard />);
        expect(getByText("Bob")).toBeInTheDocument();
    });

    it("renders user email", () => {
        const { getByText } = render(<Dashboard />);
        expect(getByText("bob@gmail.com")).toBeInTheDocument();
    });

    it("renders user address", () => {
        const { getByText } = render(<Dashboard />);
        expect(getByText("Bobby Street")).toBeInTheDocument();
    });

});