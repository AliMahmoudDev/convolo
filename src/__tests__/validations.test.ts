import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations";

// ═══════════════════════════════════════════
// Login Schema Tests
// ═══════════════════════════════════════════

describe("loginSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "any-password",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a short non-empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "x",
      });
      expect(result.success).toBe(true);
    });

    it("accepts various valid email formats", () => {
      const emails = [
        "test@example.com",
        "user.name@domain.org",
        "admin+tag@company.co.uk",
        "a@b.io",
      ];

      for (const email of emails) {
        const result = loginSchema.safeParse({
          email,
          password: "password123",
        });
        expect(result.success, `Expected "${email}" to be valid`).toBe(true);
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects an empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email");
      }
    });

    it("rejects an invalid email format", () => {
      const invalidEmails = [
        "not-an-email",
        "@domain.com",
        "missing@",
        "spaces in@email.com",
        "no-tld@domain",
      ];

      for (const email of invalidEmails) {
        const result = loginSchema.safeParse({
          email,
          password: "password123",
        });
        expect(result.success, `Expected "${email}" to be invalid`).toBe(false);
      }
    });

    it("rejects an empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain("email");
        expect(fields).toContain("password");
      }
    });
  });
});

// ═══════════════════════════════════════════
// Register Schema Tests
// ═══════════════════════════════════════════

describe("registerSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid registration", () => {
      const result = registerSchema.safeParse({
        name: "Ali Mahmoud",
        email: "ali@example.com",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a 2-character name (minimum)", () => {
      const result = registerSchema.safeParse({
        name: "Al",
        email: "al@example.com",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a 50-character name (maximum)", () => {
      const result = registerSchema.safeParse({
        name: "A".repeat(50),
        email: "user@example.com",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an 8-character password with uppercase, lowercase, and number", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "Abcdef12",
        confirmPassword: "Abcdef12",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("name validation", () => {
    it("rejects a name shorter than 2 characters", () => {
      const result = registerSchema.safeParse({
        name: "A",
        email: "user@example.com",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameIssue = result.error.issues.find((i) => i.path[0] === "name");
        expect(nameIssue?.message).toContain("at least 2");
      }
    });

    it("rejects a name longer than 50 characters", () => {
      const result = registerSchema.safeParse({
        name: "A".repeat(51),
        email: "user@example.com",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameIssue = result.error.issues.find((i) => i.path[0] === "name");
        expect(nameIssue?.message).toContain("under 50");
      }
    });

    it("rejects an empty name", () => {
      const result = registerSchema.safeParse({
        name: "",
        email: "user@example.com",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("email validation", () => {
    it("rejects an invalid email", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "not-valid",
        password: "Secure123",
        confirmPassword: "Secure123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssue = result.error.issues.find((i) => i.path[0] === "email");
        expect(emailIssue?.message).toContain("valid email");
      }
    });
  });

  describe("password validation", () => {
    it("rejects a password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "Ab1",
        confirmPassword: "Ab1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
        expect(pwIssue?.message).toContain("at least 8");
      }
    });

    it("rejects a password without uppercase letter", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "lowercase123",
        confirmPassword: "lowercase123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
        expect(pwIssue?.message).toContain("uppercase");
      }
    });

    it("rejects a password without lowercase letter", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "UPPERCASE123",
        confirmPassword: "UPPERCASE123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
        expect(pwIssue?.message).toContain("lowercase");
      }
    });

    it("rejects a password without a number", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "NoNumbers",
        confirmPassword: "NoNumbers",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const pwIssue = result.error.issues.find((i) => i.path[0] === "password");
        expect(pwIssue?.message).toContain("number");
      }
    });
  });

  describe("confirmPassword validation", () => {
    it("rejects when passwords do not match", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "Secure123",
        confirmPassword: "Different123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmIssue = result.error.issues.find((i) => i.path[0] === "confirmPassword");
        expect(confirmIssue?.message).toContain("do not match");
      }
    });

    it("error path points to confirmPassword field", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "Secure123",
        confirmPassword: "WrongPass456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatch = result.error.issues.find((i) => i.message.includes("do not match"));
        expect(mismatch?.path).toEqual(["confirmPassword"]);
      }
    });
  });
});
