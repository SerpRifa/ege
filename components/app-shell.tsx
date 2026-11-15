"use client";

import { logoutAction } from "@/app/actions/auth";
import { RewardHost } from "@/components/reward-ceremony";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Главная" },
  { href: "/log", label: "Запись" },
  { href: "/achievements", label: "Ачивки" },
  { href: "/charts", label: "Графики" },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  displayName,
  children,
}: {
  displayName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4">
      <header className="flex items-center justify-between gap-3 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          ЕГЭ-путь
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm ${isCurrent(pathname, link.href) ? "bg-panel-2 text-cream" : "text-muted"}`}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{displayName}</span>
          <form action={logoutAction}>
            <button type="submit" className="rounded-full border border-line px-3 py-2 text-sm">
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="pb-28 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/95 px-2 py-2 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-5xl grid-cols-4 gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-2xl px-2 py-3 text-center text-sm ${isCurrent(pathname, link.href) ? "bg-gold text-ink" : "text-muted"}`}
                aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <RewardHost />
    </div>
  );
}
