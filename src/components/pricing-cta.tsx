"use client";

import { useEffect, useState } from "react";
import { ProRequestForm } from "@/components/pro-request-form";

interface Props {
  label: string;
  source?: string;
  className?: string;
}

/**
 * Client-only button that opens the Pro plan enquiry form. Lives inside the
 * server-rendered /pricing page so the page itself can still export metadata.
 *
 * Also listens for the global `omg:open-pro-request` event and the
 * #enquire URL fragment so other components (usage banner, billing page)
 * can deep-link straight to the modal.
 */
export function PricingCta({ label, source = "pricing_page", className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openIfHash = () => {
      if (window.location.hash === "#enquire") setOpen(true);
    };
    const openOnEvent = () => setOpen(true);
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    window.addEventListener("omg:open-pro-request", openOnEvent);
    return () => {
      window.removeEventListener("hashchange", openIfHash);
      window.removeEventListener("omg:open-pro-request", openOnEvent);
    };
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#enquire") {
      const url = window.location.pathname + window.location.search;
      window.history.replaceState({}, "", url);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className ?? "btn btn-primary"}
        onClick={() => setOpen(true)}
      >
        {label} →
      </button>
      <ProRequestForm open={open} source={source} onClose={close} />
    </>
  );
}
