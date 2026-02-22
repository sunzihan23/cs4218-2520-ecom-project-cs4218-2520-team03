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
    
    // Arrange: Robust LocalStorage Mocking
    const localStorageMock = {
      getItem: jest.fn((key) => key === 'auth' ? JSON.stringify({ user: mockUser }) : null),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(cleanup);

  // Helper: Setup follows the "Factory" pattern for better code quality
  const setup = (userContext = { user: mockUser }) => {
    useAuth.mockReturnValue([userContext, mockSetAuth]);
    const utils = render(<MemoryRouter><Profile /></MemoryRouter>);
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

  it("should initialize form with authenticated user data", () => {
    // Act
    const { getInputs, getByTestId } = setup();
    const inputs = getInputs();

    // Assert: Behavioral guarantee that user sees their info
    expect(inputs.name.value).toBe(mockUser.name);
    expect(inputs.email).toBeDisabled(); // Email must be immutable
    expect(getByTestId("layout")).toHaveAttribute("data-title", "Your Profile");
  });

  it("should gracefully handle missing or partial user data (Lines 25, 29-32)", () => {
    // Arrange & Act: Simulating a state where user data is incomplete
    const { getInputs } = setup({ user: { name: null, email: undefined } });
    
    // Assert: Contract ensures empty strings instead of 'null' text in inputs
    expect(getInputs().name.value).toBe("");
    expect(getInputs().email.value).toBe("");
  });

  it("should block submission and show validation errors for empty required fields (Line 54)", async () => {
    // Arrange
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    // Act: Clear data and attempt update
    fireEvent.change(inputs.name, { target: { name: "name", value: "" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "" } });
    fireEvent.click(inputs.submitBtn);

    // Assert: Contract guarantees error feedback
    expect(await findByText(/name is required/i)).toBeInTheDocument();
    expect(await findByText(/phone number is required/i)).toBeInTheDocument();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("should enforce phone number formatting (digits and length)", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    // Act: Invalid format
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "abcdefgh" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/phone number must contain only digits/i)).toBeInTheDocument();

    // Act: Invalid length
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "123" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/phone number must be 8 digits long/i)).toBeInTheDocument();
  });

  it("should validate password length and mismatched confirmation (Line 63)", async () => {
    const { getInputs, findByText, queryByText } = setup();
    const inputs = getInputs();

    // Act: Mismatch
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "wrongpass" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/passwords do not match/i)).toBeInTheDocument();

    // Act: Match (satisfies Line 63 false branch)
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "password123" } });
    expect(queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });

  it("should successfully update profile and persistence layers (Line 76)", async () => {
    // Arrange: Mock successful API response
    const updatedUser = { ...mockUser, name: "Zihan Updated" };
    axios.put.mockResolvedValueOnce({ data: { updatedUser } });
    const { getInputs } = setup();
    const inputs = getInputs();

    // Act
    fireEvent.change(inputs.name, { target: { name: "name", value: "Zihan Updated" } });
    fireEvent.click(inputs.submitBtn);

    // Assert: Contractual requirements
    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({ user: updatedUser }));
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
      
      // Verify Line 76: password is NOT sent if not modified
      const payload = axios.put.mock.calls[0][1];
      expect(payload.password).toBeUndefined();
    });
  });

  it("should skip adding password to profileData if it is only whitespace", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    // Act: Whitespace trigger
    fireEvent.change(inputs.password, { target: { name: "password", value: "   " } });
    fireEvent.click(inputs.submitBtn);

    // Assert: Validation blocks this before the API is reached
    expect(await findByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it("should handle server-side errors and network rejections", async () => {
    // Act & Assert: API Error
    axios.put.mockResolvedValueOnce({ data: { error: "Update failed" } });
    const { getInputs: setupErr } = setup();
    fireEvent.click(setupErr().submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Update failed"));

    // Act & Assert: Network failure
    axios.put.mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(setupErr().submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });
});