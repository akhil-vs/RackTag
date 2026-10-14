import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login?next=/admin");

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <strong>RackTag</strong>
          <span className="admin-topbar-meta"> · {session.name}</span>
        </div>
        <AdminNav />
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
