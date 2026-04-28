import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/auth/schemas";

describe("auth schemas", () => {
  it("accepts a valid register payload", () => {
    const payload = {
      name: "Marcos",
      email: "marcos@example.com",
      password: "Strong123",
    };
    expect(registerSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects weak password on register", () => {
    const payload = {
      name: "Marcos",
      email: "marcos@example.com",
      password: "weakpass",
    };
    expect(registerSchema.safeParse(payload).success).toBe(false);
  });

  it("normalizes email on login", () => {
    const parsed = loginSchema.parse({
      email: "  MARCOS@EXAMPLE.COM  ",
      password: "Strong123",
    });
    expect(parsed.email).toBe("marcos@example.com");
  });
});
