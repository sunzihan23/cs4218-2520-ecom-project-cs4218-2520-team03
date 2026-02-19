// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import About from "./About";

jest.mock("./../components/Layout", () =>
    jest.fn(({ title, children }) => {
        return <div data-testid="Layout">
            <h1>
                {title}
            </h1>
            {children}
        </div>
    })
);

describe("About Component", () => {

    it("renders layout wrapper", () => {
        const { getByTestId } = render(<About />);
        expect(getByTestId("Layout")).toBeInTheDocument();
    });

    it("renders contact image", () => {
        const { getByAltText } = render(<About />);
        expect(getByAltText("contactus")).toBeInTheDocument();
    });

    it("renders description text", () => {
        const { getByText } = render(<About />);
        expect(getByText("Add text")).toBeInTheDocument();
    });

});