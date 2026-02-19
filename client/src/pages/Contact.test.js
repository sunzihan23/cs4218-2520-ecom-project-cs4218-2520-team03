// Chen Peiran, A0257826R
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Contact from "./Contact";

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

jest.mock("react-icons/bi", () => ({
    BiMailSend: () => {
        return <svg data-testid="BiMailSend-icon" />;
    },
    BiPhoneCall: () => {
        return <svg data-testid="BiPhoneCall-icon" />;
    },
    BiSupport: () => {
        return <svg data-testid="BiSupport-icon" />;
    }
}));

describe("Contact Component", () => {

    it("renders layout wrapper", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("Layout")).toBeInTheDocument();
    });

    it("renders contact image", () => {
        const { getByAltText } = render(<Contact />);
        expect(getByAltText("contactus")).toBeInTheDocument();
    });

    it("renders page title", () => {
        const { getByText } = render(<Contact />);
        expect(getByText("CONTACT US")).toBeInTheDocument();
    });

    it("renders description text", () => {
        const { getByText } = render(<Contact />);
        expect(getByText("For any query or info about product, feel free to call anytime. We are available 24X7."))
            .toBeInTheDocument();
    });

    it("renders email text correctly", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("BiMailSend"))
            .toHaveTextContent("www.help@ecommerceapp.com");
    });

    it("renders phone number correctly", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("BiPhoneCall"))
            .toHaveTextContent("012-3456789");
    });

    it("renders toll-free support number correctly", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("BiSupport"))
            .toHaveTextContent("1800-0000-0000 (toll free)");
    });

    it("renders mail icon", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("BiMailSend-icon")).toBeInTheDocument();
    });

    it("renders phone icon", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("BiPhoneCall-icon")).toBeInTheDocument();
    });

    it("renders support icon", () => {
        const { getByTestId } = render(<Contact />);
        expect(getByTestId("BiSupport-icon")).toBeInTheDocument();
    });

});