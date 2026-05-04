import { cookies } from "next/headers";
import { createHash } from "crypto";

// Soft access gate for the /build prompt builder.
//
// One shared access code lives in BUILD_ACCESS_CODE on the server. Users
// enter it once on the gate page; if it matches, we set a signed cookie
// that grants them access for 30 days. The cookie value is a deterministic
// hash of the code so the cookie can't be set client-side without knowing
// the code itself.
//
// If BUILD_ACCESS_CODE is unset, the gate is disabled entirely and the
// builder is open to anyone signed in. Set the env var to turn the gate on.

const COOKIE_NAME = "pergamum_build_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Deterministic token derived from the access code. Cookie stores this. */
function expectedToken(): string | null {
  const code = process.env.BUILD_ACCESS_CODE;
  if (!code) return null;
  return createHash("sha256").update(`${code}:granted:v1`).digest("hex");
}

/** Whether the gate is currently in effect. */
export function isGateEnabled(): boolean {
  return !!process.env.BUILD_ACCESS_CODE;
}

/** Returns true if the current request is allowed past the gate. */
export async function hasBuildAccess(): Promise<boolean> {
  if (!isGateEnabled()) return true;
  const expected = expectedToken();
  if (!expected) return false;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === expected;
}

/**
 * Validate a submitted code and, if it matches, set the access cookie.
 * Returns true on success.
 */
export async function grantBuildAccess(code: string): Promise<boolean> {
  const accessCode = process.env.BUILD_ACCESS_CODE;
  if (!accessCode) return false;
  if (!safeEquals(code.trim(), accessCode)) return false;

  const cookieStore = await cookies();
  const token = expectedToken();
  if (!token) return false;

  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return true;
}

/** Clear the access cookie. Useful for sign-out flows or testing. */
export async function revokeBuildAccess(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Constant-time string comparison so the gate doesn't leak the code length
 * or shared prefix via timing differences.
 */
function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
