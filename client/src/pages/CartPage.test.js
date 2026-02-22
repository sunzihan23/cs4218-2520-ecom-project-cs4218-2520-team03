import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { totalPrice, default as CartPage } from "./CartPage";
//Seah Yi Xun Ryo A0252602R, tests for CartPage.js
//Parse numeric value from USD-style string ("$1,234.50" -> 1234.5). , dont use exact string matching
const parseUsdNumeric = (str) => parseFloat(String(str).replace(/[$,]/g, "")) || 0;

const usdPattern = /\$[\d,]+\.\d{2}/;

jest.mock("axios");

const mockSetCart = jest.fn();
const mockUseCart = jest.fn(() => [[], mockSetCart]);
jest.mock("../context/cart", () => ({
  useCart: () => mockUseCart(),
}));

const mockSetAuth = jest.fn();
const mockUseAuth = jest.fn(() => [{ user: null, token: "" }, mockSetAuth]);
jest.mock("../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return function MockDropIn() {
    return React.createElement("div", { "data-testid": "braintree-dropin" }, "DropIn");
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
}));

describe("totalPrice", () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should calculate sum of all item prices in cart array", () => {
    // Arrange
    const cart = [
      { _id: "1", name: "A", price: 10 },
      { _id: "2", name: "B", price: 20 },
      { _id: "3", name: "C", price: 15 },
    ];
    // Act
    const result = totalPrice(cart);
    // Assert — string matching the usd pattern and the numeric total
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBe(45);
  });

  it("should sum item.price for each item", () => {
    const cart = [
      { _id: "1", price: 99.99 },
      { _id: "2", price: 0.01 },
    ];
    const result = totalPrice(cart);
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBeCloseTo(100, 2);
  });

  it("should format total as USD currency", () => {
    const cart = [{ _id: "1", price: 1234.5 }];
    const result = totalPrice(cart);
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBe(1234.5);
  });

  it("should return zero formatted as USD for empty cart array", () => {
    const result = totalPrice([]);
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBe(0);
  });

  it("should handle undefined cart with optional chaining (returns zero)", () => {
    const result = totalPrice(undefined);
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBe(0);
  });

  it("should handle null cart with optional chaining (returns zero)", () => {
    const result = totalPrice(null);
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBe(0);
  });

  it("should return a formatted currency string", () => {
    const cart = [{ _id: "1", price: 5 }];
    const result = totalPrice(cart);
    expect(typeof result).toBe("string");
    expect(result).toMatch(usdPattern);
    expect(parseUsdNumeric(result)).toBe(5);
  });

  it("should not throw and should log error when iteration throws", () => {
    // Arrange — unusual object that mimics array but throws in map
    const throwingCart = {
      map: () => {
        throw new Error("map error");
      },
    };
    // Act
    const result = totalPrice(throwingCart);
    // Assert — documents current behavior: log error and return undefined
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result).toBeUndefined();
  });
});

describe("CartPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCart.mockReturnValue([[], mockSetCart]);
    mockUseAuth.mockReturnValue([{ user: null, token: "" }, mockSetAuth]);
    axios.get.mockResolvedValue({ data: { clientToken: null } });
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(<CartPage />);
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it("should show Hello Guest when user is not logged in", () => {
      render(<CartPage />);
      expect(screen.getByText(/hello guest/i)).toBeInTheDocument();
    });

    it("should show user name when logged in", () => {
      mockUseAuth.mockReturnValue([
        { user: { name: "Jane" }, token: "fake-token" },
        mockSetAuth,
      ]);
      render(<CartPage />);
      expect(screen.getByText(/hello.*jane/i)).toBeInTheDocument();
    });

    it("should show Your Cart Is Empty when cart is empty", () => {
      render(<CartPage />);
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });

    it("should show item count and login hint when cart has items and not logged in", () => {
      const cart = [
        { _id: "1", name: "Product A", description: "Desc A", price: 10 },
      ];
      mockUseCart.mockReturnValue([cart, mockSetCart]);
      render(<CartPage />);
      expect(screen.getByText(/you have 1 items/i)).toBeInTheDocument();
      expect(screen.getByText(/please login to checkout/i)).toBeInTheDocument();
    });

    it("should render cart items with name, description, price and Remove button", () => {
      const cart = [
        { _id: "p1", name: "Product A", description: "Short desc", price: 25 },
      ];
      mockUseCart.mockReturnValue([cart, mockSetCart]);
      render(<CartPage />);
      expect(screen.getByText(/product a/i)).toBeInTheDocument();
      expect(screen.getByText(/short desc/i)).toBeInTheDocument();
      expect(screen.getByText(/price : 25/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });

    it("should show Cart Summary and Total", () => {
      render(<CartPage />);
      expect(screen.getByText(/cart summary/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /total :/i })).toBeInTheDocument();
    });

    it("should display total using totalPrice when cart has items", () => {
      const cart = [
        { _id: "1", name: "A", description: "D", price: 15 },
      ];
      mockUseCart.mockReturnValue([cart, mockSetCart]);
      render(<CartPage />);
      const totalHeading = screen.getByRole("heading", { name: /total :/i });
      expect(totalHeading).toBeInTheDocument();
      expect(totalHeading.textContent).toMatch(usdPattern);
      const usdMatch = totalHeading.textContent.match(usdPattern);
      expect(parseUsdNumeric(usdMatch ? usdMatch[0] : "")).toBe(15);
    });

    it("should show Update Address when user has no address but is logged in", () => {
      mockUseAuth.mockReturnValue([
        { user: { name: "User" }, token: "token" },
        mockSetAuth,
      ]);
      render(<CartPage />);
      expect(screen.getByRole("button", { name: /update address/i })).toBeInTheDocument();
    });

    it("should show Plase Login to checkout when not logged in", () => {
      const cart = [{ _id: "1", name: "A", description: "D", price: 5 }];
      mockUseCart.mockReturnValue([cart, mockSetCart]);
      render(<CartPage />);
      expect(screen.getByRole("button", { name: /plase login to checkout/i })).toBeInTheDocument();
    });
  });

  describe("When user acts", () => {
    it("should call setCart and localStorage.setItem when Remove is clicked", async () => {
      const cart = [{ _id: "p1", name: "A", description: "D", price: 10 }];
      mockUseCart.mockReturnValue([cart, mockSetCart]);
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation();
      render(<CartPage />);
      await userEvent.click(screen.getByRole("button", { name: /remove/i }));
      expect(mockSetCart).toHaveBeenCalledWith([]);
      expect(setItemSpy).toHaveBeenCalledWith("cart", "[]");
      setItemSpy.mockRestore();
    });

    it("should call getToken (axios.get braintree/token) when auth.token is present", async () => {
      mockUseAuth.mockReturnValue([
        { user: { name: "User" }, token: "token" },
        mockSetAuth,
      ]);
      axios.get.mockResolvedValue({ data: { clientToken: "bt-token" } });
      render(<CartPage />);
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
      });
    });

    it("should not throw when getToken fails", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();
      mockUseAuth.mockReturnValue([
        { user: { name: "User" }, token: "token" },
        mockSetAuth,
      ]);
      axios.get.mockRejectedValue(new Error("token failed"));
      expect(() => render(<CartPage />)).not.toThrow();
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
      });
      expect(logSpy).toHaveBeenCalledWith(expect.any(Error));
      logSpy.mockRestore();
    });

    it("should navigate to profile when Update Address is clicked", async () => {
      mockUseAuth.mockReturnValue([
        { user: { name: "User" }, token: "token" },
        mockSetAuth,
      ]);
      render(<CartPage />);
      await userEvent.click(screen.getByRole("button", { name: /update address/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
    });

    it("should navigate to login with state when Plase Login to checkout is clicked", async () => {
      const cart = [{ _id: "1", name: "A", description: "D", price: 5 }];
      mockUseCart.mockReturnValue([cart, mockSetCart]);
      render(<CartPage />);
      await userEvent.click(screen.getByRole("button", { name: /plase login to checkout/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
    });
  });
});
