import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Profile from "./Profile";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockSetAuth = jest.fn();
const mockAuthData = {
  user: {
    name: "Initial Name",
    email: "initial@test.com",
    phone: "123456",
    address: "Initial Address",
  },
  token: "mock-token",
};

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [mockAuthData, mockSetAuth]),
}));

jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout-mock" data-title={title}>
    {children}
  </div>
));
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu-mock">UserMenu</div>
));

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(mockAuthData)),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should hydrate form fields from context and enforce email disability", async () => {
    const { getByDisplayValue, getByPlaceholderText, getByTestId } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(getByDisplayValue("Initial Name")).toBeInTheDocument(),
    );
    expect(getByDisplayValue("initial@test.com")).toBeInTheDocument();
    expect(getByPlaceholderText(/enter your email/i)).toBeDisabled();
    expect(getByTestId("layout-mock")).toHaveAttribute(
      "data-title",
      "Your Profile",
    );
  });

  it("should update state for all editable fields", async () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    const nameInput = getByPlaceholderText(/enter your name/i);
    const passwordInput = getByPlaceholderText(/enter your password/i);
    const phoneInput = getByPlaceholderText(/enter your phone/i);
    const addressInput = getByPlaceholderText(/enter your address/i);

    fireEvent.change(nameInput, { target: { value: "John" } });
    fireEvent.change(passwordInput, { target: { value: "newpassword" } });
    fireEvent.change(phoneInput, { target: { value: "98765432" } });
    fireEvent.change(addressInput, { target: { value: "New Address" } });

    expect(nameInput.value).toBe("John");
    expect(passwordInput.value).toBe("newpassword");
    expect(phoneInput.value).toBe("98765432");
    expect(addressInput.value).toBe("New Address");
  });

  it("should verify axios.put payload and storage sync on success", async () => {
    const updatedUser = { ...mockAuthData.user, name: "John Updated" };
    axios.put.mockResolvedValueOnce({ data: { updatedUser } });

    const { getByText, getByPlaceholderText, getByDisplayValue } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(getByDisplayValue("Initial Name")).toBeInTheDocument(),
    );

    fireEvent.change(getByPlaceholderText(/enter your name/i), {
      target: { value: "John Updated" },
    });
    fireEvent.click(getByText("UPDATE"));

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.objectContaining({
          name: "John Updated",
        }),
      ),
    );

    expect(mockSetAuth).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "auth",
      expect.stringContaining("John Updated"),
    );
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
  });

  it("should handle logical error and network failure correctly", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    axios.put.mockResolvedValueOnce({ data: { error: "Update failed logic" } });

    const { getByText, getByPlaceholderText, getByDisplayValue } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(getByDisplayValue("Initial Name")).toBeInTheDocument(),
    );

    fireEvent.change(getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(getByText("UPDATE"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Update failed logic"),
    );

    axios.put.mockRejectedValueOnce(new Error("Network Error"));

    fireEvent.click(getByText("UPDATE"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
