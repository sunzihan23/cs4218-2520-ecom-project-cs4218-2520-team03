// Sun Zihan, A0259581R
import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockSetAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null, token: "" }, mockSetAuth]),
}));

jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>{children}</div>
));

const mockedNavigate = jest.fn();
const mockLocation = { state: null };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
  useLocation: () => mockLocation,
}));

Object.defineProperty(window, "localStorage", {
  value: { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() },
  writable: true,
});

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.state = null;
  });

  afterEach(cleanup);

  const setup = () => {
    const utils = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Login />
      </MemoryRouter>
    );
    const getInputs = () => ({
      email: utils.getByPlaceholderText(/enter your email/i),
      password: utils.getByPlaceholderText(/enter your password/i),
      loginBtn: utils.getByRole("button", { name: /login/i }),
      forgotBtn: utils.getByRole("button", { name: /forgot password/i }),
    });
    return { ...utils, getInputs };
  };

  it("should validate and provide inline feedback for empty or malformed inputs", () => {
    const { getInputs, getByText } = setup();
    const { email, loginBtn } = getInputs();

    fireEvent.click(loginBtn);
    expect(getByText(/email is required/i)).toBeInTheDocument();
    expect(getByText(/password is required/i)).toBeInTheDocument();

    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.click(loginBtn);
    expect(getByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("should clear error messages immediately upon user correction", () => {
    const { getInputs, queryByText } = setup();
    const { email, password, loginBtn } = getInputs();

    fireEvent.click(loginBtn);
    expect(queryByText(/email is required/i)).toBeInTheDocument();

    fireEvent.change(email, { target: { value: "john@example.com" } });
    expect(queryByText(/email is required/i)).not.toBeInTheDocument();

    fireEvent.change(password, { target: { value: "123456" } });
    expect(queryByText(/password is required/i)).not.toBeInTheDocument();
  });

  it("should update auth context, local storage, and navigate upon success", async () => {
    const mockData = {
      success: true,
      message: "Welcome Back",
      user: { name: "John" },
      token: "valid-token",
    };
    axios.post.mockResolvedValueOnce({ data: mockData });

    const { getInputs } = setup();
    const { email, password, loginBtn } = getInputs();

    fireEvent.change(email, { target: { value: "john@example.com" } });
    fireEvent.change(password, { target: { value: "123456" } });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({
        user: mockData.user,
        token: mockData.token
      }));
      expect(localStorage.setItem).toHaveBeenCalledWith("auth", JSON.stringify(mockData));
      expect(toast.success).toHaveBeenCalledWith("Welcome Back");
      expect(mockedNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should use fallback success message when API response message is missing", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, user: {}, token: "" } });
    
    const { getInputs } = setup();
    fireEvent.change(getInputs().email, { target: { value: "john@example.com" } });
    fireEvent.change(getInputs().password, { target: { value: "123456" } });
    fireEvent.click(getInputs().loginBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login successful");
    });
  });

  it("should redirect to the intended location stored in navigation state", async () => {
    mockLocation.state = "/cart";
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    const { getInputs } = setup();
    fireEvent.change(getInputs().email, { target: { value: "john@example.com" } });
    fireEvent.change(getInputs().password, { target: { value: "123456" } });
    fireEvent.click(getInputs().loginBtn);

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/cart");
    });
  });

  it("should display server-provided error messages for authentication failures", async () => {
    const serverMessage = "Invalid email or password";
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: serverMessage },
    });
    
    const { getInputs } = setup();
    fireEvent.change(getInputs().email, { target: { value: "john@example.com" } });
    fireEvent.change(getInputs().password, { target: { value: "wrong" } });
    fireEvent.click(getInputs().loginBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(serverMessage);
    });
  });

  it("should handle network rejections and missing message fallbacks", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });
    const { getInputs } = setup();
    fireEvent.change(getInputs().email, { target: { value: "john@example.com" } });
    fireEvent.change(getInputs().password, { target: { value: "123456" } });
    fireEvent.click(getInputs().loginBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Login failed"));

    axios.post.mockRejectedValueOnce({ response: { data: { message: "Internal Error" } } });
    fireEvent.click(getInputs().loginBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Internal Error"));

    axios.post.mockRejectedValueOnce(new Error());
    fireEvent.click(getInputs().loginBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });

  it("should navigate to the password recovery flow when requested", () => {
    const { getInputs } = setup();
    fireEvent.click(getInputs().forgotBtn);
    expect(mockedNavigate).toHaveBeenCalledWith("/forgot-password");
  });
});