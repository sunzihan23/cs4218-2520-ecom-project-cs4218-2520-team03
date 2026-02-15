// Sun Zihan, A0259581R
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
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

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation((msg) => {
      if (msg.includes("React Router Future Flag Warning")) return;
      console.warn(msg);
    });
  });
  axios.get = jest.fn().mockResolvedValue({ data: [] });
  beforeEach(() => {
    axios.get?.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const fillForm = (getByPlaceholderText) => {
    fireEvent.change(getByPlaceholderText(/enter your name/i), {
      target: { value: "John" },
    });
    fireEvent.change(getByPlaceholderText(/enter your email/i), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(getByPlaceholderText(/enter your phone/i), {
      target: { value: "98765432" },
    });
    fireEvent.change(getByPlaceholderText(/enter your address/i), {
      target: { value: "Address" },
    });
    fireEvent.change(getByPlaceholderText(/enter your dob/i), {
      target: { value: "2000-01-01" },
    });
    fireEvent.change(getByPlaceholderText(/favorite sports/i), {
      target: { value: "Soccer" },
    });
  };

  it("should validate form attributes, input types, and state updates", async () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    expect(getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Register - Ecommerce App",
    );
    expect(getByPlaceholderText(/enter your name/i)).toHaveFocus();

    const placeholders = [
      /enter your name/i,
      /enter your email/i,
      /enter your password/i,
      /enter your phone/i,
      /enter your address/i,
      /enter your dob/i,
      /favorite sports/i,
    ];
    placeholders.forEach((ph) =>
      expect(getByPlaceholderText(ph)).toBeRequired(),
    );

    expect(getByPlaceholderText(/enter your email/i)).toHaveAttribute(
      "type",
      "email",
    );
    expect(getByPlaceholderText(/enter your password/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(getByPlaceholderText(/enter your dob/i)).toHaveAttribute(
      "type",
      "date",
    );

    fillForm(getByPlaceholderText);
    expect(getByPlaceholderText(/enter your name/i).value).toBe("John");

    expect(getByText("REGISTER")).toHaveAttribute("type", "submit");
  });

  it("should register successfully, prevent default, and reset all form fields", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Registered Successfully, please login" },
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fillForm(getByPlaceholderText);

    const preventDefaultSpy = jest.spyOn(Event.prototype, "preventDefault");

    fireEvent.click(getByText("REGISTER"));
    expect(preventDefaultSpy).toHaveBeenCalled();

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
        name: "John",
        email: "john@test.com",
        password: "password123",
        phone: "98765432",
        address: "Address",
        DOB: "2000-01-01",
        answer: "Soccer",
      }),
    );

    expect(toast.success).toHaveBeenCalledWith(
      "Registered Successfully, please login",
    );
    expect(mockedNavigate).toHaveBeenCalledWith("/login");

    const allFields = [
      /enter your name/i,
      /enter your email/i,
      /enter your password/i,
      /enter your phone/i,
      /enter your address/i,
      /enter your dob/i,
      /favorite sports/i,
    ];

    await waitFor(() => {
      allFields.forEach((placeholder) => {
        expect(getByPlaceholderText(placeholder).value).toBe("");
      });
    });

    preventDefaultSpy.mockRestore();
  });

  it("should handle dynamic backend errors and fallback cases", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Email already registered" },
    });
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText("REGISTER"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Email already registered"),
    );

    axios.post.mockResolvedValueOnce({ data: { success: false } });
    fireEvent.click(getByText("REGISTER"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
  });

  it("should handle network failure and log error", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
