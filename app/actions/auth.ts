"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/current";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByLogin } from "@/lib/server/users";

export type LoginState = { error: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!login || !password) {
    return { error: "Неверный логин или пароль" };
  }

  try {
    const user = await findUserByLogin(login);
    const matches = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !matches) {
      return { error: "Неверный логин или пароль" };
    }
    await setSessionCookie(user.id);
  } catch {
    return { error: "Сервис временно недоступен" };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
