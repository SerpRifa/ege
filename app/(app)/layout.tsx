import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/current";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <AppShell displayName={user.displayName}>{children}</AppShell>;
}
