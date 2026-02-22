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
jest.mock("../../components/UserMenu", () => () => <div data-testid="user-menu">User Menu</div>);

describe("Profile Component", () => {
  const mockSetAuth = jest.fn();
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    phone: "12345678",
    address: "123 React Lane",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
    
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ user: mockUser, token: "12345" })),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(cleanup);

  const setup = (userContext = { user: mockUser }) => {
    useAuth.mockReturnValue([userContext, mockSetAuth]);
    const utils = render(
      <MemoryRouter 
        future={{ 
          v7_startTransition: true, 
          v7_relativeSplatPath: true 
        }}
      >
        <Profile />
      </MemoryRouter>
    );
    const getInputs = () => ({
      name: utils.getByPlaceholderText(/enter your name/i),
      email: utils.getByPlaceholderText(/enter your email/i),
      password: utils.getByPlaceholderText(/enter your new password/i),
      confirm: utils.getByPlaceholderText(/confirm your new password/i),
      phone: utils.getByPlaceholderText(/enter your phone/i),
      address: utils.getByPlaceholderText(/enter your address/i),
      submitBtn: utils.getByRole("button", { name: /update/i }),
    });
    return { ...utils, getInputs };
  };

  it("should hydrate form with user data and handle missing field fallbacks", () => {
    const { getInputs, getByTestId } = setup();
    expect(getInputs().name.value).toBe(mockUser.name);
    expect(getByTestId("layout")).toHaveAttribute("data-title", "Your Profile");

    cleanup();
    const { getInputs: getFallbackInputs } = setup({ user: { name: null, email: undefined } });
    expect(getFallbackInputs().name.value).toBe("");
    expect(getFallbackInputs().email.value).toBe("");
  });

  it("should initialize with empty strings when auth user is missing", () => {
    const { getInputs } = setup({ user: null });
    expect(getInputs().name.value).toBe("");
  });

  it("should show errors when required fields are empty", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();
    fireEvent.change(inputs.name, { target: { name: "name", value: "" } });
    fireEvent.change(inputs.address, { target: { name: "address", value: "" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/name is required/i)).toBeInTheDocument();
    expect(await findByText(/address is required/i)).toBeInTheDocument();
    expect(await findByText(/phone number is required/i)).toBeInTheDocument();
  });

  it("should validate phone digits and length correctly", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "abc" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/phone number must contain only digits/i)).toBeInTheDocument();
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "12345" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/phone number must be 8 digits long/i)).toBeInTheDocument();
  });

  it("should validate password length and mismatch", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();
    fireEvent.change(inputs.password, { target: { name: "password", value: "123" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "mismatch" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("should not trigger password mismatch error when passwords match", async () => {
    const { getInputs, queryByText } = setup();
    const inputs = getInputs();
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "password123" } });
    fireEvent.click(inputs.submitBtn);
    expect(queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });

  it("should skip password update if password is empty", async () => {
    axios.put.mockResolvedValueOnce({ data: { updatedUser: mockUser } });
    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      const payload = axios.put.mock.calls[0][1];
      expect(payload.password).toBeUndefined();
    });
  });

  it("should handle password containing only whitespace", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.password, { target: { name: "password", value: "   " } });
    fireEvent.click(inputs.submitBtn);

    expect(await findByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("should successfully update profile and handle localStorage", async () => {
    const updatedUser = { ...mockUser, name: "Updated" };
    axios.put.mockResolvedValueOnce({ data: { updatedUser } });
    const { getInputs } = setup();
    const inputs = getInputs();
    fireEvent.change(inputs.name, { target: { name: "name", value: "Updated" } });
    fireEvent.click(inputs.submitBtn);
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({ user: updatedUser }));
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
    });
  });

  it("should handle profile update failure scenarios", async () => {
    const { getInputs } = setup();
    const inputs = getInputs();

    // Update fails but user persists
    axios.put.mockResolvedValueOnce({ data: { updatedUser: mockUser } });
    window.localStorage.getItem.mockReturnValueOnce(null);
    fireEvent.click(inputs.submitBtn);
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled();
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    // Backend data error
    axios.put.mockResolvedValueOnce({ data: { error: "Backend error" } });
    fireEvent.click(inputs.submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Backend error"));

    // Network failure
    axios.put.mockRejectedValueOnce(new Error("Network error"));
    fireEvent.click(inputs.submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });
});