"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface SidebarLinkProps {
  href: string;
  exact?: boolean;
  /** Optional badge text shown on the right (e.g. "12", "PRO"). */
  badge?: string | number | null;
  /** SVG icon (16x16, stroke-current). */
  icon: ReactNode;
  /** Visible label (hidden when sidebar is collapsed). */
  label: string;
  /** Optional title for the tooltip when collapsed. Defaults to label. */
  title?: string;
}

export function SidebarLink({
  href,
  exact = false,
  badge,
  icon,
  label,
  title,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      title={title ?? label}
      data-nav-link
      className={`nav-link${isActive ? " active" : ""}`}
      prefetch={false}
    >
      <span className="icon" aria-hidden="true">{icon}</span>
      <span className="label-text">{label}</span>
      <span className="badge" aria-hidden={!badge}>{badge ?? ""}</span>
    </Link>
  );
}

/**
 * Hamburger toggle that lives at the top of the sidebar.
 * Toggles body.sidebar-collapsed and persists the user's preference.
 */
export function SidebarToggle() {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("omg-sidebar-collapsed");
    const next = stored === null ? true : stored === "1";
    setCollapsed(next);
    document.body.classList.toggle("sidebar-collapsed", next);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      document.body.classList.toggle("sidebar-collapsed", next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("omg-sidebar-collapsed", next ? "1" : "0");
      }
      window.dispatchEvent(new CustomEvent("omg:sidebar-tooltip-hide"));
      return next;
    });
  };

  const action = collapsed ? "Show sidebar" : "Hide sidebar";

  return (
    <button
      type="button"
      className="sidebar-toggle"
      title={action}
      onClick={toggle}
      data-nav-link
    >
      <span className="icon">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="14" y2="12" />
        </svg>
      </span>
      <span className="label-text">{action}</span>
    </button>
  );
}

/**
 * Collapsible section header for the sidebar (e.g. ACCOUNT).
 * Children are expanded by default; collapsing animates max-height.
 */
export function SidebarSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        className={`section-toggle${open ? "" : " collapsed"}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="label">{label}</span>
        <span className="caret">▾</span>
      </button>
      <div className={`section-children${open ? "" : " collapsed"}`}>
        {children}
      </div>
    </>
  );
}

/**
 * Floating tooltip that appears next to a sidebar nav item when the sidebar
 * is collapsed. Rendered into the body so it escapes sidebar overflow clipping.
 */
export function SidebarTooltipHost() {
  const [text, setText] = useState<string>("");
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onEnter = (e: Event) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const navItem = target.closest<HTMLElement>("[data-nav-link]");
      if (!navItem) return;
      if (!document.body.classList.contains("sidebar-collapsed")) return;
      const t = navItem.getAttribute("title");
      if (!t) return;
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      const rect = navItem.getBoundingClientRect();
      setText(t);
      setPos({ left: rect.right + 10, top: rect.top + rect.height / 2 });
      setVisible(true);
    };
    const onLeave = (e: Event) => {
      if (!(e instanceof MouseEvent)) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const navItem = target.closest<HTMLElement>("[data-nav-link]");
      if (!navItem) return;
      const related = e.relatedTarget;
      // Cursor moved to a child of the same nav item — keep tooltip visible.
      if (related instanceof Node && navItem.contains(related)) return;
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setVisible(false), 80);
    };
    const onForceHide = () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      setVisible(false);
    };
    document.addEventListener("mouseover", onEnter);
    document.addEventListener("mouseout", onLeave);
    window.addEventListener("omg:sidebar-tooltip-hide", onForceHide);
    window.addEventListener("scroll", onForceHide, true);
    window.addEventListener("blur", onForceHide);
    return () => {
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
      window.removeEventListener("omg:sidebar-tooltip-hide", onForceHide);
      window.removeEventListener("scroll", onForceHide, true);
      window.removeEventListener("blur", onForceHide);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  return (
    <div
      className={`sidebar-tooltip${visible ? " visible" : ""}`}
      style={{ left: pos.left, top: pos.top, transform: "translateY(-50%)" }}
    >
      {text}
    </div>
  );
}
