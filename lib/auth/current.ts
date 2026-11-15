import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/auth/session";
import { findUserById } from "@/lib/server/users";

export async function readSessionUserId(): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token, secret);
  return session?.userId ?? null;
}

export async function setSessionCookie(userId: string): Promise<void> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const jar = await cookies();
  jar.set(
    SESSION_COOKIE,
    await signSession(userId, secret),
    sessionCookieOptions(process.env.NODE_ENV === "production"),
  );
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: SESSION_COOKIE, path: "/" });
}

export async function requireUser(): Promise<{ id: string; login: string; displayName: string }> {
  const userId = await readSessionUserId();
  if (!userId) redirect("/login");
  const user = await findUserById(userId);
  if (!user) {
    await clearSessionCookie();
    redirect("/login");
  }
  return user;
}
