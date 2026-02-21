// Sun Zihan, A0259581R
import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth";

jest.mock("axios", () => ({
  defaults: {
    headers: {
      common: {},
    },
  },
}));

describe("Auth Context and useAuth Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults.headers.common = {};
  });

  afterEach(cleanup);

  const TestComponent = () => {
    const [auth, setAuth] = useAuth();
    return (
      <div>
        <div data-testid="user">{auth?.user ? auth.user.name : "null"}</div>
        <div data-testid="token">{auth?.token || "empty"}</div>
        <button onClick={() => setAuth({ user: { name: "New User" }, token: "new-token" })}>
          LOGIN
        </button>
        <button onClick={() => setAuth({ user: null, token: "" })}>
          LOGOUT
        </button>
      </div>
    );
  };

  it("should provide default empty auth state and no authorization header", () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user").textContent).toBe("null");
    expect(getByTestId("token").textContent).toBe("empty");
    expect(axios.defaults.headers.common["Authorization"]).toBeUndefined();
  });

  it("should restore auth state from localStorage and set authorization header on load", async () => {
    const savedAuth = { user: { name: "Jane Doe" }, token: "secret-token" };
    localStorage.setItem("auth", JSON.stringify(savedAuth));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user").textContent).toBe("Jane Doe");
      expect(axios.defaults.headers.common["Authorization"]).toBe("secret-token");
    });
  });

  it("should update global axios headers immediately when user logs in", async () => {
    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(getByText("LOGIN"));

    await waitFor(() => {
      expect(getByTestId("token").textContent).toBe("new-token");
      expect(axios.defaults.headers.common["Authorization"]).toBe("new-token");
    });
  });

  it("should remove authorization headers from axios upon logout", async () => {
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    fireEvent.click(getByText("LOGIN"));
    await waitFor(() => expect(axios.defaults.headers.common["Authorization"]).toBe("new-token"));

    fireEvent.click(getByText("LOGOUT"));

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBeUndefined();
    });
  });

  it("should remain in default state if localStorage contains invalid data", () => {
    localStorage.setItem("auth", "corrupted-{json");

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user").textContent).toBe("null");
    expect(getByTestId("token").textContent).toBe("empty");
  });
});