import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CartProvider, useCart } from "./cart.js";
//Seah Yi Xun Ryo A0252602R, tests for cart.js
// consumer component to read context and expose cart and setCart
const TestConsumer = () => {
  const [cart, setCart] = useCart();
  return (
    <div>
      <span data-testid="context-value-length">{Array.isArray([cart, setCart]) ? [cart, setCart].length : 0}</span>
      <span data-testid="cart-length">{cart ? cart.length : "none"}</span>
      <span data-testid="cart-json">{JSON.stringify(cart)}</span>
      <button
        data-testid="set-cart-one"
        onClick={() => setCart([{ _id: "1", name: "Product 1", price: 10 }])}
      >
        Set one item
      </button>
    </div>
  );
};

describe("Cart Context", () => {
  let getItemMock;
  let setItemMock;

  beforeEach(() => {
    getItemMock = jest.fn();
    setItemMock = jest.fn();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: getItemMock,
        setItem: setItemMock,
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe("CartProvider", () => {
    it("should provide a context value that is an array of length 2 (cart and setCart)", () => {
      // Arrange
      getItemMock.mockReturnValue(null);

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert
      expect(screen.getByTestId("context-value-length")).toHaveTextContent("2");
    });

    it("should render children", () => {
      // Arrange
      getItemMock.mockReturnValue(null);

      // Act
      render(
        <CartProvider>
          <span data-testid="child">Child content</span>
        </CartProvider>
      );

      // Assert
      expect(screen.getByTestId("child")).toHaveTextContent("Child content");
    });
  });

  describe("useCart", () => {
    it("should return the context value when used inside CartProvider", () => {
      // Arrange
      getItemMock.mockReturnValue(null);

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert - value is [cart, setCart]; consumer can read cart length
      expect(screen.getByTestId("cart-length")).toHaveTextContent("0");
      expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual([]);
    });

    it("should return current cart state", () => {
      // Arrange
      getItemMock.mockReturnValue(null);

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert
      expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual([]);
    });
  });

  describe("Initial state", () => {
    it("should have empty cart when localStorage has no cart key", () => {
      // Arrange
      getItemMock.mockReturnValue(null);

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert
      expect(screen.getByTestId("cart-length")).toHaveTextContent("0");
      expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual([]);
    });

    it("should have empty cart when localStorage getItem returns null", () => {
      // Arrange
      getItemMock.mockReturnValue(null);

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert
      expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual([]);
    });
  });

  describe("LocalStorage hydration", () => {
    it("should hydrate cart from localStorage when cart key has valid JSON array", async () => {
      // Arrange
      const storedCart = [{ _id: "1", name: "Item", price: 5 }];
      getItemMock.mockReturnValue(JSON.stringify(storedCart));

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("cart-length")).toHaveTextContent("1");
      });
      expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual(storedCart);
      expect(getItemMock).toHaveBeenCalledWith("cart");
    });

    it("should hydrate empty array when localStorage has empty array string", async () => {
      // Arrange
      getItemMock.mockReturnValue("[]");

      // Act
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Assert
      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual([]);
      });
    });
  });

  describe("setCart updates state", () => {
    it("should update cart when setCart is called", async () => {
      // Arrange
      getItemMock.mockReturnValue(null);
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );
      expect(screen.getByTestId("cart-length")).toHaveTextContent("0");

      // Act
      fireEvent.click(screen.getByTestId("set-cart-one"));

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("cart-length")).toHaveTextContent("1");
      });
      expect(JSON.parse(screen.getByTestId("cart-json").textContent)).toEqual([
        { _id: "1", name: "Product 1", price: 10 },
      ]);
    });
  });
});
