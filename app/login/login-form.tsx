"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-3xl bg-panel p-4">
      <label className="grid gap-2">
        Логин
        <input
          name="login"
          autoComplete="username"
          required
          className="min-h-12 rounded-2xl border border-line bg-ink px-3 text-base"
        />
      </label>
      <label className="grid gap-2">
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 rounded-2xl border border-line bg-ink px-3 text-base"
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-danger">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-2xl bg-gold font-semibold text-ink disabled:opacity-60"
      >
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
