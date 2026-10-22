import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Who is asking, without accounts.
 *
 * The host: one password in PORTFOLIO_HOST_PASSWORD. Signing in on /portfoliohost stores a
 * hash of it in an httpOnly cookie, so changing the password signs everyone out.
 *
 * A note's author: a random token in an httpOnly cookie, set when they place their first
 * note. The goals table keeps only its sha256, so notes can be edited from that browser alone.
 */

const HOST_COOKIE = "htf_portfolio_host";
const OWNER_COOKIE = "htf_goal_owner";
const YEAR = 60 * 60 * 24 * 365;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function hostPassword(): string | undefined {
  return process.env.PORTFOLIO_HOST_PASSWORD?.trim() || undefined;
}

function hostToken(password: string): string {
  return sha256(`htf-portfolio-host:${password}`);
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isHostConfigured(): boolean {
  return hostPassword() !== undefined;
}

export async function isHost(): Promise<boolean> {
  const password = hostPassword();
  const value = (await cookies()).get(HOST_COOKIE)?.value;
  return Boolean(password && value && same(value, hostToken(password)));
}

/** Server actions only (cookie writes). */
export async function signInHost(attempt: string): Promise<boolean> {
  const password = hostPassword();
  if (!password || !same(hostToken(attempt), hostToken(password))) return false;
  (await cookies()).set(HOST_COOKIE, hostToken(password), cookieOptions(60 * 60 * 24 * 30));
  return true;
}

export async function signOutHost(): Promise<void> {
  (await cookies()).delete(HOST_COOKIE);
}

/** The hash of this browser's note token, or null before its first note. */
export async function ownerHash(): Promise<string | null> {
  const token = (await cookies()).get(OWNER_COOKIE)?.value;
  return token ? sha256(token) : null;
}

/** Server actions only: issues the token on the first note. */
export async function ensureOwnerHash(): Promise<string> {
  const store = await cookies();
  let token = store.get(OWNER_COOKIE)?.value;
  if (!token) {
    token = randomUUID();
    store.set(OWNER_COOKIE, token, cookieOptions(YEAR));
  }
  return sha256(token);
}
