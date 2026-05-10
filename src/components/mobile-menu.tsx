"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
}

export function MobileMenu({ navLinks }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("modal-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const overlay = (
    <div
      className="mobile-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="mobile-menu-panel">
        <div className="mobile-menu-head">
          <span className="mobile-menu-eyebrow">MENU</span>
          <button
            type="button"
            className="mobile-menu-close"
            aria-label="Close menu"
            onClick={close}
          >
            ×
          </button>
        </div>

        <div className="mobile-menu-theme">
          <span className="mobile-menu-label">THEME</span>
          <ThemeToggle />
        </div>

        <nav className="mobile-menu-nav">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={close}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mobile-menu-actions">
          <Link
            href="/auth/login"
            className="mobile-menu-login"
            onClick={close}
          >
            LOG IN
          </Link>
          <Link
            href="/onboarding"
            className="mobile-menu-cta"
            onClick={close}
          >
            START FREE →
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="mobile-menu-trigger"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && mounted && createPortal(overlay, document.body)}

      <style jsx>{`
        .mobile-menu-trigger {
          display: none;
          width: 44px;
          height: 44px;
          padding: 0;
          margin: 0 12px;
          background: none;
          border: 1px solid var(--rule-strong);
          cursor: pointer;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: border-color 0.18s ease;
        }
        .mobile-menu-trigger:hover { border-color: var(--teal); }
        .mobile-menu-trigger span {
          display: block;
          width: 18px;
          height: 2px;
          background: var(--ink);
          transition: background 0.18s ease;
        }
        .mobile-menu-trigger:hover span { background: var(--teal-bright); }

        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: var(--overlay-bg);
          backdrop-filter: blur(14px) saturate(1.4);
          -webkit-backdrop-filter: blur(14px) saturate(1.4);
          display: flex;
          justify-content: flex-end;
          animation: mm-fade 0.22s ease;
        }
        @keyframes mm-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .mobile-menu-panel {
          width: min(420px, 100%);
          height: 100%;
          background: var(--bg);
          border-left: 1px solid var(--rule-strong);
          padding: 24px 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          overflow-y: auto;
          animation: mm-slide 0.28s ease;
        }
        @keyframes mm-slide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }

        .mobile-menu-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--rule);
        }
        .mobile-menu-eyebrow {
          font-family: var(--body);
          font-size: 11px;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .mobile-menu-close {
          width: 36px;
          height: 36px;
          background: none;
          border: 1px solid var(--rule-strong);
          color: var(--ink-2);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: color 0.18s ease, border-color 0.18s ease;
          font-family: inherit;
        }
        .mobile-menu-close:hover {
          color: var(--vermilion);
          border-color: var(--vermilion);
        }

        .mobile-menu-theme {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--rule);
        }
        .mobile-menu-label {
          font-family: var(--body);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
        }

        .mobile-menu-nav {
          display: flex;
          flex-direction: column;
        }
        .mobile-menu-nav :global(a) {
          display: block;
          padding: 16px 0;
          color: var(--ink);
          text-decoration: none;
          font-family: var(--body);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-bottom: 1px solid var(--rule);
          transition: color 0.18s ease, padding-left 0.18s ease;
        }
        .mobile-menu-nav :global(a:hover) {
          color: var(--teal-bright);
          padding-left: 8px;
        }

        .mobile-menu-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 24px;
        }
        .mobile-menu-actions :global(a.mobile-menu-login) {
          display: block;
          padding: 14px 18px;
          text-align: center;
          color: var(--ink);
          text-decoration: none;
          border: 1px solid var(--rule-strong);
          font-family: var(--body);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: border-color 0.18s ease, color 0.18s ease;
        }
        .mobile-menu-actions :global(a.mobile-menu-login:hover) {
          border-color: var(--teal);
          color: var(--teal-bright);
        }
        .mobile-menu-actions :global(a.mobile-menu-cta) {
          display: block;
          padding: 16px 18px;
          text-align: center;
          background: var(--teal);
          color: #fff;
          text-decoration: none;
          font-family: var(--body);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: background 0.18s ease;
        }
        .mobile-menu-actions :global(a.mobile-menu-cta:hover) {
          background: var(--vermilion);
        }

        @media (max-width: 980px) {
          .mobile-menu-trigger { display: flex; }
        }
      `}</style>
    </>
  );
}
