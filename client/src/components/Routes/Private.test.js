// Chen Peiran, A0257826R
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn()
}));

const setAuth = jest.fn();

jest.mock("../Spinner", () =>
    () => <div>Spinner</div>
);

jest.mock("react-router-dom", () => ({
    Outlet: () => <div>Outlet</div>,
}));

describe("PrivateRoute Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders Spinner and does not call API when no token", () => {
        useAuth.mockReturnValue([{ user: "user", token: "" }, setAuth]);

        const { getByText } = render(<PrivateRoute />);

        expect(getByText("Spinner")).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    it("renders Outlet when authentication succeeds", async () => {
        useAuth.mockReturnValue([{ user: "user", token: "mock-token" }, setAuth]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        const { getByText } = render(<PrivateRoute />);

        expect(getByText("Spinner")).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
        });

        await waitFor(() => {
            expect(getByText("Outlet")).toBeInTheDocument();
        });
    });

    it("renders Spinner when token is invalid", async () => {
        useAuth.mockReturnValue([{ user: "user", token: "token" }, setAuth]);
        axios.get.mockResolvedValueOnce({ data: { ok: false } });

        const { getByText } = render(<PrivateRoute />);

        expect(getByText("Spinner")).toBeInTheDocument();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
        });

        await waitFor(() => {
            expect(getByText("Spinner")).toBeInTheDocument();
        });

    });

});