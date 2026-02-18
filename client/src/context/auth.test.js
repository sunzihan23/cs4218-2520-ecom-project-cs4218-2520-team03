// Sun Zihan, A0259581R
import React from "react";
import { render, act, waitFor } from "@testing-library/react";
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
    axios.defaults.headers.common["Authorization"] = "";
  });

  const TestComponent = () => {
    const [auth, setAuth] = useAuth();
    return (
      <div>
        <div data-testid="user">{auth?.user ? auth.user.name : "null"}</div>
        <div data-testid="token">{auth?.token || "empty"}</div>
        <button
          onClick={() =>
            setAuth({ user: { name: "Updated User" }, token: "updated-token" })
          }
        >
          UPDATE_AUTH
        </button>
      </div>
    );
  };

  it("should initialize with default null user and empty token", () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user").textContent).toBe("null");
    expect(getByTestId("token").textContent).toBe("empty");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  it("should hydrate state from localStorage on mount and update axios headers", async () => {
    const mockAuthData = {
      user: { name: "John Doe" },
      token: "mock-jwt-token",
    };

    const getItemSpy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue(JSON.stringify(mockAuthData));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getItemSpy).toHaveBeenCalledWith("auth");
    
    await waitFor(() => {
      expect(getByTestId("user").textContent).toBe("John Doe");
      expect(getByTestId("token").textContent).toBe("mock-jwt-token");
    });

    expect(axios.defaults.headers.common["Authorization"]).toBe("mock-jwt-token");
    
    getItemSpy.mockRestore();
  });

  it("should handle invalid or missing localStorage data gracefully", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user").textContent).toBe("null");
    expect(getByTestId("token").textContent).toBe("empty");
  });

  it("should update axios headers and context when setAuth is called", async () => {
    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const updateButton = getByText("UPDATE_AUTH");
    
    act(() => {
      updateButton.click();
    });

    await waitFor(() => {
      expect(getByTestId("user").textContent).toBe("Updated User");
      expect(getByTestId("token").textContent).toBe("updated-token");
    });

    expect(axios.defaults.headers.common["Authorization"]).toBe("updated-token");
  });
});