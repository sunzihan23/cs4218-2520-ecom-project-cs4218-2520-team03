import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Orders from "./Orders";
//Seah Yi Xun Ryo A0252602R, tests for Orders.js
jest.mock("axios");

const mockSetAuth = jest.fn();
const mockUseAuth = jest.fn(() => [{ user: { name: "Test User" }, token: "" }, mockSetAuth]);
jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock("../../components/UserMenu", () => () => <div data-testid="user-menu">User Menu</div>);

const mockFromNow = jest.fn(() => "2 days ago");
jest.mock("moment", () => {
  const moment = (date) => ({
    fromNow: () => (date ? mockFromNow() : "Invalid date"),
  });
  return moment;
});

describe("Orders (User Orders Page)", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue([{ user: { name: "Test User" }, token: "" }, mockSetAuth]);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("Rendering (no or empty data)", () => {
    it("should render without crashing when orders are empty", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      axios.get.mockResolvedValue({ data: [] });

      render(<Orders />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      expect(axios.get.mock.calls[0][0]).toMatch(/auth\/orders/);
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
    });

    it("should render Layout with title Your Orders", () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: null }, mockSetAuth]);

      render(<Orders />);

      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute("data-title", "Your Orders");
    });

    it("should render UserMenu and All Orders heading", () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: null }, mockSetAuth]);

      render(<Orders />);

      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
    });
  });

  describe("Data fetching", () => {
    it("should call GET /api/v1/auth/orders when auth.token is present", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      axios.get.mockResolvedValue({ data: [] });

      render(<Orders />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      expect(axios.get.mock.calls[0][0]).toMatch(/auth\/orders/);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("should not call orders API when auth.token is absent", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "" }, mockSetAuth]);

      render(<Orders />);
      await Promise.resolve();

      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should not call orders API when auth is undefined", async () => {
      mockUseAuth.mockReturnValue([{ user: null, token: undefined }, mockSetAuth]);

      render(<Orders />);
      await Promise.resolve();

      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should set orders and render them on successful API response", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "Alice" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [{ _id: "p1", name: "Product 1", description: "Desc one", price: 10 }],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText(/desc one/i)).toBeInTheDocument();
      expect(screen.getByText(/price : 10/i)).toBeInTheDocument();
      expect(screen.getByText("2 days ago")).toBeInTheDocument();
    });

    it("should not throw when API request fails and logs error", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const apiError = new Error("Network error");
      axios.get.mockRejectedValue(apiError);

      render(<Orders />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(apiError);
      expect(screen.getByRole("heading", { name: /all orders/i })).toBeInTheDocument();
    });
  });

  describe("Rendering with orders", () => {
    it("should render table columns for each order", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Shipped",
          buyer: { name: "Bob" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Shipped")).toBeInTheDocument();
      });
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      const table = screen.getByRole("table");
      expect(within(table).getByText("0")).toBeInTheDocument();
    });

    it("should show Failed when order payment.success is false or missing", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Not Process",
          buyer: { name: "User" },
          createAt: new Date().toISOString(),
          payment: {},
          products: [],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("should render order with missing buyer without throwing", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: null,
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
      expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("should render order with undefined payment without throwing", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "User" },
          createAt: new Date().toISOString(),
          payment: undefined,
          products: [],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    it("should render order with empty products array", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "User" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
      const table = screen.getByRole("table");
      expect(within(table).getByText("0")).toBeInTheDocument();
    });

    it("should render order with undefined products without throwing", async () => {
      mockUseAuth.mockReturnValue([{ user: {}, token: "fake-token" }, mockSetAuth]);
      const mockOrders = [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "User" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: undefined,
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
      });
    });
  });
});
