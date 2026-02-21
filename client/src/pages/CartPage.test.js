import { totalPrice } from "./CartPage";

//Parse numeric value from USD-style string ("$1,234.50" -> 1234.5). , dont use exact string matching
const parseUsdNumeric = (str) => parseFloat(String(str).replace(/[$,]/g, "")) || 0;

const usdPattern = /\$[\d,]+\.\d{2}/;

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
