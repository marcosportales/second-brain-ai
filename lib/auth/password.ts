import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SEPARATOR = ".";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(`${salt}:${password}`, "utf8")
    .digest("hex");
  return `${salt}${SEPARATOR}${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expected] = storedHash.split(SEPARATOR);
  if (!salt || !expected) {
    return false;
  }

  const actual = createHash("sha256")
    .update(`${salt}:${password}`, "utf8")
    .digest("hex");

  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
