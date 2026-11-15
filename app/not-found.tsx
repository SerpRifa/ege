import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl">Страница не найдена</h1>
      <Link href="/" className="text-gold">
        На главную
      </Link>
    </main>
  );
}
