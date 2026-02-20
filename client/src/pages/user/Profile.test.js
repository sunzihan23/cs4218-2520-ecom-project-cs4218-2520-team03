// Sun Zihan, A0259581R
import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth");

jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>{children}</div>
));
jest.mock("../../components/UserMenu", () => () => <div data-testid="user-menu">UserMenu</div>);

describe("Profile Component", () => {
  const mockUser = {
    name: "John",
    email: "john@example.com",
    phone: "88888888",
    address: "address",
  };
  const setAuthMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: mockUser }, setAuthMock]);
    
    const localStorageMock = (() => {
      let store = { auth: JSON.stringify({ user: mockUser, token: "mock-token" }) };
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(cleanup);

  const setup = () => {
    const utils = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Profile />
      </MemoryRouter>
    );
    const getFields = () => ({
      name: utils.getByPlaceholderText(/enter your name/i),
      email: utils.getByPlaceholderText(/enter your email/i),
      password: utils.getByPlaceholderText(/enter your new password/i),
      confirm: utils.getByPlaceholderText(/confirm your new password/i),
      phone: utils.getByPlaceholderText(/enter your phone/i),
      address: utils.getByPlaceholderText(/enter your address/i),
      submitBtn: utils.getByRole("button", { name: /update/i }),
    });
    return { ...utils, getFields };
  };

  it("should populate form with initial user data on mount", () => {
    const { getFields } = setup();
    const fields = getFields();
    
    expect(fields.name.value).toBe("John");
    expect(fields.email.value).toBe("john@example.com");
    expect(fields.phone.value).toBe("88888888");
    expect(fields.address.value).toBe("address");
    expect(fields.email).toBeDisabled();
  });

  it("should skip initialization logic if auth user is missing", () => {
    useAuth.mockReturnValue([null, setAuthMock]);
    const { getFields } = setup();

    expect(getFields().name.value).toBe("");
  });

  it("should use empty string fallbacks for null user fields", () => {
    useAuth.mockReturnValue([{ user: { name: null, email: null, phone: null, address: null } }, setAuthMock]);
    const { getFields } = setup();
    const fields = getFields();

    expect(fields.name.value).toBe("");
    expect(fields.email.value).toBe("");
    expect(fields.phone.value).toBe("");
    expect(fields.address.value).toBe("");
  });

  it("should update phone and address state on user input", () => {
    const { getFields } = setup();
    const fields = getFields();
    
    fireEvent.change(fields.phone, { target: { value: "99998888" } });
    fireEvent.change(fields.address, { target: { value: "new address" } });
    
    expect(fields.phone.value).toBe("99998888");
    expect(fields.address.value).toBe("new address");
  });

  it("should display error toast if passwords do not match", async () => {
    const { getFields } = setup();
    const fields = getFields();

    fireEvent.change(fields.password, { target: { value: "secret1" } });
    fireEvent.change(fields.confirm, { target: { value: "secret2" } });
    fireEvent.click(fields.submitBtn);

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("should submit valid profile updates including trimmed passwords", async () => {
    const updatedUser = { ...mockUser, name: "John Doe" };
    axios.put.mockResolvedValueOnce({ data: { updatedUser } });
    const { getFields } = setup();
    const fields = getFields();

    fireEvent.change(fields.name, { target: { value: "John Doe" } });
    fireEvent.change(fields.password, { target: { value: " pass " } });
    fireEvent.change(fields.confirm, { target: { value: " pass " } });
    fireEvent.click(fields.submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.objectContaining({ name: "John Doe", password: " pass " })
      );
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
      expect(fields.password.value).toBe("");
    });
  });

  it("should show error toast if API response contains an error field", async () => {
    axios.put.mockResolvedValueOnce({ data: { error: "Update failed" } });
    const { getFields } = setup();
    
    fireEvent.click(getFields().submitBtn);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Update failed"));
  });

  it("should handle axios rejections with various error message formats", async () => {
    const { getFields } = setup();
    const { submitBtn } = getFields();

    axios.put.mockRejectedValueOnce({ response: { data: { message: "Network fail" } } });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Network fail"));

    axios.put.mockRejectedValueOnce(new Error());
    fireEvent.click(submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });

  it("should handle corrupted localStorage gracefully without crashing", async () => {
    localStorage.getItem.mockReturnValueOnce("!");
    axios.put.mockResolvedValueOnce({ data: { updatedUser: mockUser } });
    const { getFields } = setup();

    fireEvent.click(getFields().submitBtn);

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("should handle missing localStorage entry successfully", async () => {
    localStorage.getItem.mockReturnValueOnce(null);
    axios.put.mockResolvedValueOnce({ data: { updatedUser: mockUser } });
    const { getFields } = setup();

    fireEvent.click(getFields().submitBtn);

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});