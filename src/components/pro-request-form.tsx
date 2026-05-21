"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  source?: string;
  onClose: () => void;
}

const ORG_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "startup_brand", label: "Startup Brand" },
  { value: "enterprise", label: "Enterprise Company" },
  { value: "agency", label: "Agency" },
];

/**
 * Modal form that captures a Pro plan enquiry. Persisted via
 * /api/pro-requests; on success the user is sent to /thank-you so they get
 * a clear confirmation independent of this modal's lifecycle.
 */
export function ProRequestForm({ open, source = "pricing_page", onClose }: Props) {
  const router = useRouter();
  const baseId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.classList.add("modal-open");
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/pro-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, orgType, email, phone, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push("/thank-you");
    } catch (err) {
      console.error("[pro-request-form] submit failed", err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="enquire-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="enquire-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="enquire-head">
          <div>
            <div className="enquire-eyebrow">PRO PLAN · ENQUIRY</div>
            <h2 id={`${baseId}-title`}>Request access.</h2>
            <p>
              Tell us a bit about you and our team will get in touch for a short demo and to
              activate your subscription.
            </p>
          </div>
          <button
            type="button"
            className="enquire-close"
            onClick={onClose}
            aria-label="Close enquiry form"
          >
            ×
          </button>
        </header>

        <form className="enquire-form" onSubmit={handleSubmit}>
          <label className="enquire-field">
            <span>Full name</span>
            <input
              ref={firstFieldRef}
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
              maxLength={120}
            />
          </label>

          <label className="enquire-field">
            <span>I&rsquo;m enquiring as a</span>
            <select
              required
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
            >
              <option value="" disabled>
                Select organisation type
              </option>
              {ORG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="enquire-field">
            <span>Work email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              maxLength={200}
            />
          </label>

          <label className="enquire-field">
            <span>Phone</span>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100"
              maxLength={32}
            />
          </label>

          {error && (
            <p role="alert" className="enquire-error">
              {error}
            </p>
          )}

          <div className="enquire-actions">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "SENDING…" : "REQUEST ACCESS →"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .enquire-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .enquire-shell {
          width: 100%;
          max-width: 520px;
          background: var(--surface-1);
          border: 1px solid var(--card-rule);
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7), 0 0 60px var(--teal-glow);
          display: flex;
          flex-direction: column;
          max-height: 92vh;
          overflow: hidden;
        }
        .enquire-head {
          display: flex; gap: 12px;
          padding: 22px 24px 18px;
          border-bottom: 1px solid var(--rule);
        }
        .enquire-head > div { flex: 1; min-width: 0; }
        .enquire-eyebrow {
          font-size: 10px;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--vermilion);
          margin-bottom: 8px;
        }
        .enquire-head h2 {
          font-family: var(--display);
          font-weight: 700;
          font-size: 26px;
          line-height: 1.05;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 6px;
        }
        .enquire-head p {
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.55;
          margin: 0;
        }
        .enquire-close {
          background: none;
          border: 1px solid var(--rule);
          color: var(--ink-3);
          width: 32px; height: 32px;
          font-size: 18px; line-height: 1;
          cursor: pointer;
          transition: all .15s;
          flex-shrink: 0;
        }
        .enquire-close:hover { border-color: var(--vermilion); color: var(--vermilion); }

        .enquire-form {
          padding: 20px 24px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .enquire-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .enquire-field > span {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .enquire-field input,
        .enquire-field select {
          background: var(--bg);
          border: 1px solid var(--rule);
          color: var(--ink);
          padding: 11px 14px;
          font-family: var(--body);
          font-size: 14px;
          outline: none;
          transition: border-color .18s ease;
          width: 100%;
        }
        .enquire-field input:focus,
        .enquire-field select:focus {
          border-color: var(--teal);
        }
        .enquire-field input::placeholder { color: var(--ink-3); }

        .enquire-error {
          color: var(--vermilion);
          font-size: 12.5px;
          margin: 0;
        }
        .enquire-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
