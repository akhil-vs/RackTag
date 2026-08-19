import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";

const nav = [
  { href: "/admin/insights", label: "Demand validation" },
  { href: "/admin/pilot", label: "Paid pilot" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/audit", label: "Audit export" },
  { href: "/admin/enterprise", label: "Enterprise" },
];

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
          <strong>RackTag Admin</strong>
          <span className="admin-muted"> · {session.name}</span>
        </div>
        <nav className="admin-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/">Label app</Link>
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
