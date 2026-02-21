// Sun Zihan, A0259581R
import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

jest.mock("bcrypt");

describe("authHelper Security Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should successfully transform plaintext into a bcrypt hash", async () => {
      // Arrange
      const password = "password123";
      const mockHash = "hashed_password_abc";
      bcrypt.hash.mockResolvedValue(mockHash);

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(result).toBe(mockHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it("should return null if password is not provided", async () => {
      // Act
      const result = await hashPassword("");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null as a safe fallback when hashing fails", async () => {
      // Arrange
      // We no longer spy on console.error because it is an implementation detail.
      bcrypt.hash.mockRejectedValue(new Error("Internal error"));

      // Act
      const result = await hashPassword("password123");

      // Assert: The contractual guarantee is that it returns null on failure
      expect(result).toBeNull(); 
    });
  });

  describe("comparePassword", () => {
    it("should return true when plaintext matches the hash", async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await comparePassword("password123", "correct_hash");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false if inputs are missing", async () => {
      // Act
      const result = await comparePassword("", "some_hash");

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when comparison fails or bcrypt throws", async () => {
      // Arrange
      bcrypt.compare.mockRejectedValue(new Error("Bcrypt failure"));

      // Act
      const result = await comparePassword("any_password", "any_hash");

      // Assert: Security utility must fail-closed (return false)
      expect(result).toBe(false);
    });
  });
});