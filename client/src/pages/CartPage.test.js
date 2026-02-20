import { totalPrice } from "./CartPage";

describe("totalPrice", () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("calculates sum of all item prices in cart array", () => {
    const cart = [
      { _id: "1", name: "A", price: 10 },
      { _id: "2", name: "B", price: 20 },
      { _id: "3", name: "C", price: 15 },
    ];
    expect(totalPrice(cart)).toBe("$45.00");
  });

  it("sums item.price for each item", () => {
    const cart = [
      { _id: "1", price: 99.99 },
      { _id: "2", price: 0.01 },
    ];
    expect(totalPrice(cart)).toBe("$100.00");
  });

  it("formats total as USD currency using toLocaleString", () => {
    const cart = [{ _id: "1", price: 1234.5 }];
    const result = totalPrice(cart);
    expect(result).toMatch(/\$[\d,]+\.\d{2}/);
    expect(result).toBe("$1,234.50");
  });

  it("returns $0.00 for empty cart array", () => {
    expect(totalPrice([])).toBe("$0.00");
  });

  it("handles undefined cart with optional chaining (returns $0.00)", () => {
    expect(totalPrice(undefined)).toBe("$0.00");
  });

  it("handles null cart with optional chaining (returns $0.00)", () => {
    expect(totalPrice(null)).toBe("$0.00");
  });

  it("returns a formatted currency string", () => {
    const cart = [{ _id: "1", price: 5 }];
    const result = totalPrice(cart);
    expect(typeof result).toBe("string");
    expect(result).toBe("$5.00");
  });

  it("logs error to console and does not throw when iteration throws", () => {
    const throwingCart = {
      map: () => {
        throw new Error("map error");
      },
    };
    const result = totalPrice(throwingCart);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result).toBeUndefined();
  });
});
