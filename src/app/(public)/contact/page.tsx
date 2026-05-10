import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact - OMG Bridge",
  description:
    "Get in touch with the OMG Bridge team. We typically reply within one business day.",
};

export default function ContactPage() {
  return (
    <div className="page-shell">
      {/* HERO */}
      <section className="page-hero">
        <div className="page-hero-body">
          <div className="section-eyebrow">
            <span className="num">01</span>
            <span>CONTACT</span>
            <span className="rule" />
          </div>
          <h1>
            Get in <span className="accent">touch.</span>
          </h1>
          <p className="lede">
            We typically reply within one business day.
          </p>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section className="contact-section">
        <div className="contact-body">
          <div className="contact-grid">
            <div className="contact-form-col">
              <ContactForm />
            </div>

            <aside className="contact-card">
              <h3>Reach us directly</h3>

              <div className="contact-row">
                <div className="contact-label">EMAIL</div>
                <a className="contact-value" href="mailto:hello@theomg.ai">
                  hello@theomg.ai
                </a>
              </div>

              <div className="contact-row">
                <div className="contact-label">OFFICE</div>
                <div className="contact-value">Bengaluru, India</div>
              </div>

              <div className="contact-row">
                <div className="contact-label">HOURS</div>
                <div className="contact-value">
                  Monday to Friday, 9am to 6pm IST
                </div>
              </div>

              <div className="contact-row">
                <div className="contact-label">RESPONSE TIME</div>
                <div className="contact-value">
                  Typically within 1 business day
                </div>
              </div>

              <div className="contact-divider" />

              <div className="contact-label">FOLLOW</div>
              <div className="contact-socials">
                <a
                  href="https://twitter.com/theomgai"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X (Twitter)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="20"
                    height="20"
                  >
                    <path d="M4 4l16 16" />
                    <path d="M20 4L4 20" />
                  </svg>
                  <span>X / TWITTER</span>
                </a>
                <a
                  href="https://www.linkedin.com/company/wodo-digital"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="20"
                    height="20"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="1" />
                    <path d="M7 10v7" />
                    <path d="M7 7v.01" />
                    <path d="M11 17v-4a2 2 0 014 0v4" />
                    <path d="M11 10v7" />
                  </svg>
                  <span>LINKEDIN</span>
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style>{`
        .page-shell { min-height: 100%; }

        .page-hero {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .page-hero-body { padding: 64px 56px 72px; max-width: 1100px; }
        .page-hero h1 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(40px, 5.4vw, 64px);
          line-height: 1.0;
          letter-spacing: -0.035em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .page-hero h1 .accent { color: var(--vermilion); }
        .page-hero .lede {
          font-size: 16px;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 580px;
        }

        .contact-section {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .contact-body { padding: 56px 56px 80px; }

        .contact-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 48px;
          align-items: start;
        }

        .contact-card {
          background: var(--surface-1);
          border: 1px solid var(--rule-strong);
          padding: 32px;
        }
        .contact-card h3 {
          font-family: var(--display);
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--rule);
        }
        .contact-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 0;
          border-bottom: 1px solid var(--rule);
        }
        .contact-row:last-of-type { border-bottom: none; }
        .contact-label {
          font-family: var(--body);
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .contact-value {
          font-size: 14px;
          color: var(--ink);
          text-decoration: none;
        }
        a.contact-value { color: var(--teal-bright); transition: color 0.18s ease; }
        a.contact-value:hover { color: var(--vermilion); }

        .contact-divider {
          height: 1px;
          background: var(--rule);
          margin: 16px 0;
        }
        .contact-socials {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }
        .contact-socials a {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          color: var(--ink-2);
          text-decoration: none;
          border: 1px solid var(--rule);
          font-family: var(--body);
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          transition: border-color 0.18s ease, color 0.18s ease;
        }
        .contact-socials a:hover {
          border-color: var(--teal);
          color: var(--teal-bright);
        }
        .contact-socials a svg { flex-shrink: 0; }

        @media (max-width: 980px) {
          .page-hero-body { padding: 40px 20px 48px; }
          .contact-body { padding: 32px 20px 56px; }
          .contact-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </div>
  );
}
