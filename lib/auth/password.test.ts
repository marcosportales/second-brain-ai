import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("validates the original password", () => {
    const password = "Secur3Passw0rd";
    const hash = hashPassword(password);

    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("Secur3Passw0rd");

    expect(verifyPassword("invalid", hash)).toBe(false);
  });
});
