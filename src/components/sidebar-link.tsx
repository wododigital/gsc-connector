"use client";

import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}

export function SidebarLink({ href, exact = false, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <a href={href} className={`sidebar-item${isActive ? " active" : ""}`}>
      {children}
    </a>
  );
}
