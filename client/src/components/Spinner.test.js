// Chen Peiran, A0257826R
import React from "react";
import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Spinner from "./Spinner";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/mocklocation" }),
}));

describe("Spinner Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("renders initial state", () => {
        const { getByRole, getByText } = render(<Spinner />);

        expect(getByText("redirecting to you in 3 second")).toBeInTheDocument();
        expect(getByRole("status")).toBeInTheDocument();
        expect(getByText("Loading...")).toBeInTheDocument();
    })

    it("updates countdown every second", async () => {
        const { getByText } = render(<Spinner />);

        act(() => jest.advanceTimersByTime(1000));
        expect(getByText("redirecting to you in 2 second")).toBeInTheDocument();
        act(() => jest.advanceTimersByTime(1000));
        expect(getByText("redirecting to you in 1 second")).toBeInTheDocument();
    });

    it("redirects to /login by default", async () => {
        render(<Spinner />)

        act(() => jest.advanceTimersByTime(3000));

        expect(mockNavigate).toHaveBeenCalledWith("/login", {
            state: "/mocklocation",
        });
    });

    it("redirects to specified path when provided", async () => {
        render(<Spinner path="newpath" />);

        act(() => jest.advanceTimersByTime(3000))

        expect(mockNavigate).toHaveBeenCalledWith("/newpath", {
            state: "/mocklocation",
        });
    });

    it("clears interval when Spinner component is unmounted", async () => {
        const { unmount } = render(<Spinner />);
        unmount();

        act(() => jest.advanceTimersByTime(3000))
        expect(mockNavigate).not.toHaveBeenCalled();
    });


})