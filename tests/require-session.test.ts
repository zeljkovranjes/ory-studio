import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mutable cookie store backing the mocked next/headers.
let cookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "studio_session" && cookieValue !== undefined
        ? { value: cookieValue }
        : undefined,
  }),
}));

import { requireSession, UnauthorizedError } from "@/lib/require-session";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

describe("requireSession", () => {
  beforeEach(() => {
    process.env.STUDIO_SESSION_SECRET = "test-secret-for-require-session";
    // A configured admin password means the guard is active (closed mode).
    process.env.STUDIO_ADMIN_PASSWORD = "admin-pw";
    cookieValue = undefined;
  });
  afterEach(() => {
    delete process.env.STUDIO_SESSION_SECRET;
    delete process.env.STUDIO_ADMIN_PASSWORD;
    delete process.env.STUDIO_DEV_OPEN;
  });

  it("uses the studio_session cookie name", () => {
    expect(SESSION_COOKIE).toBe("studio_session");
  });

  it("is open only when STUDIO_DEV_OPEN is explicitly true", async () => {
    process.env.STUDIO_DEV_OPEN = "true";
    cookieValue = undefined;
    await expect(requireSession()).resolves.toBeUndefined();
  });

  it("fails closed (requires a session) when no password is set but dev-open is off", async () => {
    delete process.env.STUDIO_ADMIN_PASSWORD;
    cookieValue = undefined;
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws UnauthorizedError when no session cookie is present", async () => {
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws when the token signature is invalid", async () => {
    const now = Math.floor(Date.now() / 1000);
    const good = await createSessionToken(now);
    cookieValue = good.slice(0, -1) + (good.endsWith("a") ? "b" : "a");
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws when the token is expired", async () => {
    // createSessionToken adds a 12h TTL; sign a stamp far in the past instead.
    const longPast = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30;
    const expired = await createSessionToken(longPast - 60 * 60 * 12);
    cookieValue = expired;
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("resolves for a valid, unexpired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    cookieValue = await createSessionToken(now);
    await expect(requireSession()).resolves.toBeUndefined();
  });
});
