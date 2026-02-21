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
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify({ user: mockUser, token: "12345" })),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(cleanup);

  const setup = () => {
    const utils = render(
      <MemoryRouter>
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

  it("should populate form with initial user data from auth context", () => {
    const { getInputs } = setup();
    const inputs = getInputs();

    expect(inputs.name.value).toBe(mockUser.name);
    expect(inputs.email.value).toBe(mockUser.email);
    expect(inputs.phone.value).toBe(mockUser.phone);
    expect(inputs.address.value).toBe(mockUser.address);
    expect(inputs.email).toBeDisabled();
  });

  it("should show validation errors for empty required fields", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.name, { target: { value: "" } });
    fireEvent.change(inputs.address, { target: { value: "" } });
    fireEvent.change(inputs.phone, { target: { value: "" } });

    fireEvent.click(inputs.submitBtn);

    expect(await findByText(/name is required/i)).toBeInTheDocument();
    expect(await findByText(/address is required/i)).toBeInTheDocument();
    expect(await findByText(/phone number is required/i)).toBeInTheDocument();
  });

  it("should show validation errors for invalid phone format", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.phone, { target: { value: "abcdefgh" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/phone number must contain only digits/i)).toBeInTheDocument();

    fireEvent.change(inputs.phone, { target: { value: "123" } });
    fireEvent.click(inputs.submitBtn);
    expect(await findByText(/phone number must be 8 digits long/i)).toBeInTheDocument();
  });

  it("should show validation errors for password mismatch", async () => {
    const { getInputs, findByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.password, { target: { value: "123456" } });
    fireEvent.change(inputs.confirm, { target: { value: "654321" } });
    fireEvent.click(inputs.submitBtn);

    expect(await findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("should successfully update profile and update local storage/context", async () => {
    const updatedUser = { ...mockUser, name: "John Updated" };
    axios.put.mockResolvedValueOnce({
      data: { updatedUser },
    });

    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.name, { target: { value: "John Updated" } });
    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "John Updated",
        email: mockUser.email,
        phone: mockUser.phone,
        address: mockUser.address,
      });
      expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({ user: updatedUser }));
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
    });
  });

  it("should include password in request if provided and valid", async () => {
    axios.put.mockResolvedValueOnce({
      data: { updatedUser: mockUser },
    });

    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.password, { target: { value: "newpassword123" } });
    fireEvent.change(inputs.confirm, { target: { value: "newpassword123" } });
    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.objectContaining({ password: "newpassword123" })
      );
      expect(inputs.password.value).toBe("");
      expect(inputs.confirm.value).toBe("");
    });
  });

  it("should handle server-side error messages", async () => {
    axios.put.mockResolvedValueOnce({
      data: { error: "Email already taken" },
    });

    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already taken");
    });
  });

  it("should handle network or API failure", async () => {
    axios.put.mockRejectedValueOnce({
      response: { data: { message: "Internal Server Error" } },
    });

    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Internal Server Error");
    });
  });

  it("should clear error messages when user starts typing", async () => {
    const { getInputs, queryByText, findByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.name, { target: { value: "" } });
    fireEvent.click(inputs.submitBtn);
    
    expect(await findByText(/name is required/i)).toBeInTheDocument();

    fireEvent.change(inputs.name, { target: { value: "J" } });
    expect(queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});