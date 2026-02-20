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

describe("Register Component Behavioral Tests", () => {
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
      submitBtn: utils.getByText("REGISTER"),
    });
    return { ...utils, getInputs };
  };

  const fillValidForm = (inputs) => {
    fireEvent.change(inputs.name, { target: { name: "name", value: "John Doe" } });
    fireEvent.change(inputs.email, { target: { name: "email", value: "john@test.com" } });
    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "password123" } });
    fireEvent.change(inputs.phone, { target: { name: "phone", value: "98765432" } });
    fireEvent.change(inputs.address, { target: { name: "address", value: "123 Street" } });
    fireEvent.change(inputs.answer, { target: { name: "answer", value: "Soccer" } });
  };

  it("should provide visual feedback and prevent submission for invalid inputs", async () => {
    const { getInputs, getByText, queryByText } = setup();
    const inputs = getInputs();

    fireEvent.change(inputs.email, { target: { name: "email", value: "invalidEmail" } });
    fireEvent.click(inputs.submitBtn);
    expect(inputs.email).toHaveClass("is-invalid");
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/fix|errors/i));

    fireEvent.change(inputs.password, { target: { name: "password", value: "123" } });
    fireEvent.click(inputs.submitBtn);
    expect(inputs.password).toHaveClass("is-invalid");

    fireEvent.change(inputs.password, { target: { name: "password", value: "password123" } });
    fireEvent.change(inputs.confirm, { target: { name: "confirmPassword", value: "different" } });
    fireEvent.click(inputs.submitBtn);
    expect(inputs.confirm).toHaveClass("is-invalid");
    
    fireEvent.change(inputs.email, { target: { name: "email", value: "valid@test.com" } });
    expect(inputs.email).not.toHaveClass("is-invalid");
    expect(queryByText(/valid email/i)).not.toBeInTheDocument();
  });

  it("should complete registration flow and reset form state on success", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "User Created" },
    });
    
    const { getInputs } = setup();
    const inputs = getInputs();
    fillValidForm(inputs);

    fireEvent.click(inputs.submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({ confirmPassword: expect.any(String) })
      );
      expect(toast.success).toHaveBeenCalledWith(expect.any(String));
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
      expect(inputs.name.value).toBe("");
    });
  });

  it("should use fallback success message when response message is missing", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    const { getInputs } = setup();
    fillValidForm(getInputs());
    fireEvent.click(getInputs().submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registered successfully, please login");
    });
  });

  it("should handle server-side errors and fallback generic messages", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Server Error" },
    });
    const { getInputs } = setup();
    fillValidForm(getInputs());
    fireEvent.click(getInputs().submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Server Error"));

    axios.post.mockResolvedValueOnce({ data: { success: false } });
    fireEvent.click(getInputs().submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });

  it("should handle network rejections and show appropriate feedback", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: "API Failure" } },
    });
    const { getInputs } = setup();
    fillValidForm(getInputs());
    fireEvent.click(getInputs().submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("API Failure"));

    axios.post.mockRejectedValueOnce(new Error("Timeout"));
    fireEvent.click(getInputs().submitBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
  });

  it("should verify correct input configurations", () => {
    const { getInputs } = setup();
    const inputs = getInputs();
    expect(inputs.name).toHaveFocus();
    expect(inputs.password).toHaveAttribute("type", "password");
    expect(inputs.submitBtn).toHaveAttribute("type", "submit");
  });
});