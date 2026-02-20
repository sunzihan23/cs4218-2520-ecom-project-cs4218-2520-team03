// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Policy from "./Policy";

jest.mock("./../components/Layout", () =>
    ({ children }) => <div>{children}</div>
);

describe("Policy Component", () => {

    it("renders contact image", () => {
        const { getByAltText } = render(<Policy />);
        expect(getByAltText("contactus")).toBeInTheDocument();
    });

    it("renders description text", () => {
        const { getAllByText } = render(<Policy />);
        expect(getAllByText("add privacy policy")).toHaveLength(7);
    });

});