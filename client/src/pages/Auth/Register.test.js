// Sun Zihan, A0259581R
import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>{children}</div>
));

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  const setup = () => {
    const utils = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </MemoryRouter>
    );
    const getInputs = () => ({
      name: utils.getByPlaceholderText(/enter your name/i),
      email: utils.getByPlaceholderText(/enter your email/i),
      password: utils.getByPlaceholderText(/enter your password/i),
      confirm: utils.getByPlaceholderText(/confirm your password/i),
      phone: utils.getByPlaceholderText(/enter your phone/i),
      address: utils.getByPlaceholderText(/enter your address/i),
      answer: utils.getByPlaceholderText(/favorite sport/i),
      submitBtn: utils.getByRole("button", { name: /register/i }),
    });
    return { ...utils, getInputs };
  };

  it("should update input values correctly and clear specific errors on change", () => {
    const { getInputs, getByText, queryByText } = setup();
    const inputs = getInputs();

    fireEvent.click(inputs.submitBtn);
    expect(getByText(/name is required/i)).toBeInTheDocument();

    fireEvent.change(inputs.name, { target: { name: "name", value: "John" } });
    
    expect(inputs.name.value).toBe("John");
    expect(queryByText(/name is required/i)).not.toBeInTheDocument();
  });

  it("should show inline validation for all syntax and format rules", () => {
    const { getInputs, getByText, queryByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.email, { target: { name: "email", value: "invalid" } });
    fireEvent.click(inputs.submitBtn);
    expect(getByText(/please enter a valid email address/i)).toBeInTheDocument();
    fireEvent.change(inputs.email, { target: { name: "email", value: "john@test.com" } });

    fireEvent.change(inputs.password, { target: { name: "password", value: "123" } });
    fireEvent.click(inputs.submitBtn);
    expect(getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();

    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "mismatch" } });
    fireEvent.click(inputs.submitBtn);
    expect(getByText(/passwords do not match/i)).toBeInTheDocument();

    fireEvent.change(inputs.phone, { target: { name: "phone", value: "abc" } });
    fireEvent.click(inputs.submitBtn);
    expect(getByText(/phone number must contain only digits/i)).toBeInTheDocument();
    
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "12345" } });
    fireEvent.click(inputs.submitBtn);
    expect(getByText(/phone number must be 8 digits long/i)).toBeInTheDocument();
  });

  it("should successfully register and reset form state when response message is present", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "John's account created" },
    });

    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.name, { target: { name: "name", value: "John" } });
    fireEvent.change(inputs.email, { target: { name: "email", value: "john@test.com" } });
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "password123" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "98765432" } });
    fireEvent.change(inputs.address, { target: { name: "address", value: "123 Street" } });
    fireEvent.change(inputs.answer, { target: { name: "answer", value: "Soccer" } });

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(inputs.name.value).toBe("");
      expect(toast.success).toHaveBeenCalledWith("John's account created");
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should successfully register with fallback success message when response message is missing", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    const { getInputs } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.name, { target: { name: "name", value: "John" } });
    fireEvent.change(inputs.email, { target: { name: "email", value: "john@test.com" } });
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "password123" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "98765432" } });
    fireEvent.change(inputs.address, { target: { name: "address", value: "123 Street" } });
    fireEvent.change(inputs.answer, { target: { name: "answer", value: "Soccer" } });

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(inputs.name.value).toBe("");
      expect(toast.success).toHaveBeenCalledWith("Registration successful, please login");
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should handle server-side errors and network rejections", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Email already exists" },
    });
    const { getInputs } = setup();
    const inputs = getInputs();
    
    fireEvent.change(inputs.name, { target: { name: "name", value: "John" } });
    fireEvent.change(inputs.email, { target: { name: "email", value: "john@test.com" } });
    fireEvent.change(inputs.password, { target: { name: "password", value: "pass123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "pass123" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "12345678" } });
    fireEvent.change(inputs.address, { target: { name: "address", value: "SG" } });
    fireEvent.change(inputs.answer, { target: { name: "answer", value: "S" } });

    fireEvent.click(inputs.submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Email already exists"));

    axios.post.mockRejectedValueOnce(new Error());
    fireEvent.click(inputs.submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });

  it("should verify correct accessibility attributes and initial focus", () => {
    const { getInputs } = setup();
    const inputs = getInputs();
    expect(inputs.name).toHaveFocus();
    expect(inputs.password).toHaveAttribute("type", "password");
  });
});