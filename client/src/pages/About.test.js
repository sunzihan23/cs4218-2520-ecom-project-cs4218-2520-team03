// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import About from "./About";

jest.mock("./../components/Layout", () =>
    ({ children }) => <div>{children}</div>
);

describe("About Component", () => {

    it("renders contact image", () => {
        const { getByAltText } = render(<About />);
        expect(getByAltText("contactus")).toBeInTheDocument();
    });

    it("renders description text", () => {
        const { getByText } = render(<About />);
        expect(getByText("Add text")).toBeInTheDocument();
    });

});