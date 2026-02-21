// Sun Zihan, A0259581R
import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import ForgotPassword from "./ForgotPassword";

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

describe("ForgotPassword Component Behavioral Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  const setup = () => {
    const utils = render(
      <MemoryRouter 
        initialEntries={["/forgot-password"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ForgotPassword />
      </MemoryRouter>
    );
    const getFields = () => ({
      email: utils.getByPlaceholderText(/enter your email/i),
      answer: utils.getByPlaceholderText(/enter your favorite sport/i),
      password: utils.getByPlaceholderText(/enter your new password/i),
      confirm: utils.getByPlaceholderText(/confirm your new password/i),
      submitBtn: utils.getByRole("button", { name: /reset/i }),
    });
    return { ...utils, getFields };
  };

  it("should update input values correctly when the user types", () => {
    const { getFields } = setup();
    const fields = getFields();

    fireEvent.change(fields.email, { target: { value: "test@example.com" } });
    fireEvent.change(fields.answer, { target: { value: "Basketball" } });
    fireEvent.change(fields.password, { target: { value: "newpass123" } });
    fireEvent.change(fields.confirm, { target: { value: "newpass123" } });

    expect(fields.email.value).toBe("test@example.com");
    expect(fields.answer.value).toBe("Basketball");
    expect(fields.password.value).toBe("newpass123");
    expect(fields.confirm.value).toBe("newpass123");
  });

  it("should prevent submission and show error if passwords do not match", async () => {
    const { getFields } = setup();
    const fields = getFields();

    fireEvent.change(fields.email, { target: { value: "test@test.com" } });
    fireEvent.change(fields.answer, { target: { value: "sport" } });
    fireEvent.change(fields.password, { target: { value: "pass123" } });
    fireEvent.change(fields.confirm, { target: { value: "pass456" } });
    fireEvent.click(fields.submitBtn);

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should successfully reset password and navigate to login on success", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Password reset successful" },
    });

    const { getFields } = setup();
    const fields = getFields();

    fireEvent.change(fields.email, { target: { value: "test@example.com" } });
    fireEvent.change(fields.answer, { target: { value: "Soccer" } });
    fireEvent.change(fields.password, { target: { value: "password123" } });
    fireEvent.change(fields.confirm, { target: { value: "password123" } });
    fireEvent.click(fields.submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
        email: "test@example.com",
        answer: "Soccer",
        newPassword: "password123",
      });
      expect(toast.success).toHaveBeenCalledWith("Password reset successful");
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should handle server-side failure messages correctly", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid answer" },
    });

    const { getFields } = setup();
    const fields = getFields();

    fireEvent.change(fields.email, { target: { value: "test@test.com" } });
    fireEvent.change(fields.answer, { target: { value: "wrong" } });
    fireEvent.change(fields.password, { target: { value: "pass" } });
    fireEvent.change(fields.confirm, { target: { value: "pass" } });
    fireEvent.click(fields.submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid answer");
    });
  });

  it("should provide appropriate feedback for network rejections", async () => {
    const { getFields } = setup();
    const fields = getFields();

    axios.post.mockRejectedValueOnce({
      response: { data: { message: "Internal server error" } },
    });

    fireEvent.change(fields.email, { target: { value: "test@test.com" } });
    fireEvent.change(fields.answer, { target: { value: "sport" } });
    fireEvent.change(fields.password, { target: { value: "pass" } });
    fireEvent.change(fields.confirm, { target: { value: "pass" } });
    fireEvent.click(fields.submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Internal server error");
    });

    axios.post.mockRejectedValueOnce(new Error());
    fireEvent.click(fields.submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});