"use client";

import { useState } from "react";

interface FormState {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
}

const TOPICS = [
  { value: "general", label: "General inquiry" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    topic: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: EMAIL - wire up to real endpoint when transactional email is implemented
    console.log("[contact] submitted", form);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="contact-success">
        <div className="check">✓</div>
        <h3>Sent.</h3>
        <p>
          Thanks {form.name || "there"}. We will reply to{" "}
          <strong>{form.email}</strong> within one business day.
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setForm({
              name: "",
              email: "",
              company: "",
              topic: "general",
              message: "",
            });
            setSubmitted(false);
          }}
        >
          Send another message
        </button>

        <style jsx>{`
          .contact-success {
            background: var(--surface-1);
            border: 1px solid var(--rule-strong);
            padding: 48px 36px;
            text-align: center;
          }
          .check {
            width: 64px;
            height: 64px;
            border: 2px solid var(--teal);
            border-radius: 50%;
            display: grid;
            place-items: center;
            margin: 0 auto 24px;
            color: var(--teal);
            font-size: 28px;
            font-weight: 600;
          }
          .contact-success h3 {
            font-family: var(--display);
            font-weight: 700;
            font-size: 28px;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
            color: var(--ink);
          }
          .contact-success p {
            font-size: 14px;
            color: var(--ink-2);
            line-height: 1.6;
            max-width: 400px;
            margin: 0 auto 24px;
          }
          .contact-success p strong { color: var(--ink); font-weight: 600; }
        `}</style>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="row two">
        <div className="field">
          <label className="input-label" htmlFor="contact-name">
            NAME
          </label>
          <input
            id="contact-name"
            className="input-field"
            type="text"
            value={form.name}
            onChange={update("name")}
            required
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label className="input-label" htmlFor="contact-email">
            WORK EMAIL
          </label>
          <input
            id="contact-email"
            className="input-field"
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="row two">
        <div className="field">
          <label className="input-label" htmlFor="contact-company">
            COMPANY
          </label>
          <input
            id="contact-company"
            className="input-field"
            type="text"
            value={form.company}
            onChange={update("company")}
            autoComplete="organization"
          />
        </div>
        <div className="field">
          <label className="input-label" htmlFor="contact-topic">
            WHAT&apos;S THIS ABOUT?
          </label>
          <select
            id="contact-topic"
            className="input-field"
            value={form.topic}
            onChange={update("topic")}
            required
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="input-label" htmlFor="contact-message">
          MESSAGE
        </label>
        <textarea
          id="contact-message"
          className="input-field"
          rows={6}
          value={form.message}
          onChange={update("message")}
          required
          placeholder="Tell us what you are working on, what you need, or what is on your mind."
        />
      </div>

      <button type="submit" className="btn btn-primary submit-btn">
        Send Message →
      </button>

      <style jsx>{`
        .contact-form {
          background: var(--surface-1);
          border: 1px solid var(--rule-strong);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .row.two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .field {
          display: flex;
          flex-direction: column;
        }
        .field :global(textarea.input-field) {
          resize: vertical;
          min-height: 140px;
          font-family: var(--body);
        }
        .field :global(select.input-field) {
          appearance: none;
          -webkit-appearance: none;
          background-image: linear-gradient(45deg, transparent 50%, var(--ink-3) 50%),
            linear-gradient(135deg, var(--ink-3) 50%, transparent 50%);
          background-position:
            calc(100% - 18px) 50%,
            calc(100% - 12px) 50%;
          background-size:
            6px 6px,
            6px 6px;
          background-repeat: no-repeat;
          padding-right: 36px;
          cursor: pointer;
        }
        .submit-btn {
          margin-top: 8px;
          align-self: flex-start;
        }
        @media (max-width: 720px) {
          .contact-form { padding: 24px; }
          .row.two { grid-template-columns: 1fr; }
        }
      `}</style>
    </form>
  );
}
