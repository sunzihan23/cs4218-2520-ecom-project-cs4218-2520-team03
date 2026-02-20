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
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  const setup = () => {
    const utils = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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
      submitBtn: utils.getByText("REGISTER"),
    });
    return { ...utils, getInputs };
  };

  const fillValidForm = (inputs) => {
    fireEvent.change(inputs.name, { target: { name: "name", value: "John Doe" } });
    fireEvent.change(inputs.email, { target: { name: "email", value: "john@example.com" } });
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "password123" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "98765432" } });
    fireEvent.change(inputs.address, { target: { name: "address", value: "123 Street" } });
    fireEvent.change(inputs.answer, { target: { name: "answer", value: "Soccer" } });
  };

  it("should validate form field requirements, types, and initial autofocus", () => {
    const { getInputs, getByTestId } = setup();
    const inputs = getInputs();

    expect(getByTestId("layout")).toHaveAttribute("data-title", "Register - Ecommerce App");
    expect(inputs.name).toHaveFocus();
    
    const requiredFields = ["name", "email", "password", "confirm", "phone", "address", "answer"];
    requiredFields.forEach((field) => {
      expect(inputs[field]).toBeRequired();
    });

    expect(inputs.email).toHaveAttribute("type", "email");
    expect(inputs.password).toHaveAttribute("type", "password");
    expect(inputs.confirm).toHaveAttribute("type", "password");
    expect(inputs.submitBtn).toHaveAttribute("type", "submit");
  });

  it("should handle frontend validation and clear errors on state update", async () => {
    const { getInputs, getByText, queryByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.email, { target: { name: "email", value: "wrong-email" } });
    fireEvent.change(inputs.password, { target: { name: "password", value: "12" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "34" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "1234" } });
    
    fireEvent.click(inputs.submitBtn);

    expect(getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
    expect(getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(getByText(/phone number must be 8 digits long/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Please fix the errors in the form");

    fireEvent.change(inputs.email, { target: { name: "email", value: "valid@email.com" } });
    expect(queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  it("should register successfully, reset state, and navigate to login", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Registered successfully, please login" },
    });
    
    const { getInputs } = setup();
    const inputs = getInputs();
    fillValidForm(inputs);

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "98765432",
        address: "123 Street",
        answer: "Soccer",
      });
      expect(toast.success).toHaveBeenCalledWith("Registered successfully, please login");
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
      expect(inputs.name.value).toBe("");
      expect(inputs.email.value).toBe("");
    });
  });

  it("should use fallback success message if message property is null", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true }
    });
    
    const { getInputs } = setup();
    fillValidForm(getInputs());

    fireEvent.click(getInputs().submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registered successfully, please login");
    });
  });

  it("should display backend error message when registration fails", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "User already exists" },
    });
    const { getInputs } = setup();
    fillValidForm(getInputs());

    fireEvent.click(getInputs().submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User already exists");
    });
  });

  it("should display fallback error when success is false without message", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false } });
    const { getInputs } = setup();
    fillValidForm(getInputs());

    fireEvent.click(getInputs().submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("should handle network errors with generic fallback message", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    const { getInputs } = setup();
    fillValidForm(getInputs());

    fireEvent.click(getInputs().submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});