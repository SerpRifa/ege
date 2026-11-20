"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/current";
import { verifyPassword } from "@/lib/auth/password";
import { databaseTarget, describeError, errorChain } from "@/lib/log";
import { findUserByLogin } from "@/lib/server/users";

export type LoginState = { error: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!login || !password) {
    return { error: "Неверный логин или пароль" };
  }

  let step = "find-user";
  try {
    const user = await findUserByLogin(login);
    step = "verify-password";
    const matches = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !matches) {
      console.info("[login] rejected", { login, userFound: Boolean(user) });
      return { error: "Неверный логин или пароль" };
    }
    step = "set-session";
    await setSessionCookie(user.id);
  } catch (error) {
    console.error("[login] failed", {
      step,
      login,
      database: databaseTarget(),
      sessionSecret: process.env.SESSION_SECRET ? "set" : "missing",
      error: describeError(error),
    });
    return { error: `Сервис временно недоступен (${step}). ${errorChain(error)}` };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
