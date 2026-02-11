import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Policy from "./Policy";

jest.mock("../components/Layout", () =>
    jest.fn(({ title, children }) => {
        return <div data-testid="Layout">
            <h1>
                {title}
            </h1>
            {children}
        </div>
    })
);

describe("Policy Component", () => {

    it("renders layout wrapper", () => {
        const { getByTestId } = render(<Policy />);
        expect(getByTestId("Layout")).toBeInTheDocument();
    })

    it("renders contact image", () => {
        const { getByAltText } = render(<Policy />);
        expect(getByAltText("contactus")).toBeInTheDocument();
    });

    it("renders description text", () => {
        const { getAllByText } = render(<Policy />);
        expect(getAllByText("add privacy policy")).toHaveLength(7);
    });

});