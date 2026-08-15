import { getSession } from "@/auth/online/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isElectron = process.env.IS_ELECTRON === "true" || process.env.NEXT_PUBLIC_IS_ELECTRON === "true";

  let sessionData = {
    username: "Local Workspace",
    email: "Offline Mode",
  };

  if (!isElectron) {
    const session = await getSession();

    if (!session) {
      redirect("/login");
    }

    sessionData = {
      username: session.username || "Developer",
      email: session.email || "developer@example.com",
    };
  }

  return (
    <AppShell session={sessionData}>
      {children}
    </AppShell>
  );
}
