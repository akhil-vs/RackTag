"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin/insights", label: "Usage" },
  { href: "/admin/pilot", label: "Pilot" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/enterprise", label: "Integrations" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
      <Link href="/">Label app</Link>
    </nav>
  );
}
