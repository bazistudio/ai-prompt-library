import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const sessionData = {
    username: session.username || "Developer",
    email: session.email || "developer@example.com",
  };

  return (
    <AppShell session={sessionData}>
      {children}
    </AppShell>
  );
}
