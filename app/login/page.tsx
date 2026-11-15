import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-sm content-center gap-6 px-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-gold">ЕГЭ-путь</p>
        <h1 className="font-display text-4xl">Вход</h1>
        <p className="mt-2 text-muted">Два личных аккаунта. Регистрации нет.</p>
      </div>
      <LoginForm />
    </main>
  );
}
