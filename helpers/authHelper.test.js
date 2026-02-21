// Sun Zihan, A0259581R
import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

jest.mock("bcrypt");

describe("authHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should successfully transform plaintext into a bcrypt hash", async () => {
      const password = "password123";
      const mockHash = "hashed_password_abc";
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await hashPassword(password);

      expect(result).toBe(mockHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("should return null if password is not provided", async () => {
      const result = await hashPassword("");

      expect(result).toBeNull();
    });

    it("should return null as a safe fallback when hashing fails", async () => {
      bcrypt.hash.mockRejectedValue(new Error("Internal error"));

      const result = await hashPassword("password123");

      expect(result).toBeNull(); 
    });
  });

  describe("comparePassword", () => {
    it("should return true when plaintext matches the hash", async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword("password123", "correct_hash");

      expect(result).toBe(true);
    });

    it("should return false if inputs are missing", async () => {
      const result = await comparePassword("", "some_hash");

      expect(result).toBe(false);
    });

    it("should return false when comparison fails or bcrypt throws", async () => {
      bcrypt.compare.mockRejectedValue(new Error("Bcrypt failure"));

      const result = await comparePassword("any_password", "any_hash");

      expect(result).toBe(false);
    });
  });
});