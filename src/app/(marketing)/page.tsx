"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────
   AI brand SVG paths (verbatim from demo — official brand marks)
   ──────────────────────────────────────────────────────────── */

const SVG_CHATGPT =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"/></svg>';

const SVG_CLAUDE =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.64445 2.55279C8.39746 2.05881 7.79679 1.85859 7.30281 2.10558C6.80883 2.35257 6.60861 2.95324 6.8556 3.44722L9.68128 9.09859L5.06655 5.92596C4.61145 5.61308 3.98887 5.72837 3.67598 6.18348C3.3631 6.63858 3.47839 7.26116 3.9335 7.57405L9.40503 11.3357L3.05258 11.0014C2.50106 10.9724 2.03043 11.3959 2.00141 11.9474C1.97238 12.499 2.39594 12.9696 2.94747 12.9986L8.74187 13.3036L4.44532 16.168C3.9858 16.4743 3.86162 17.0952 4.16797 17.5547C4.47433 18.0142 5.0952 18.1384 5.55473 17.8321L9.19687 15.404L6.68629 18.9188C6.36528 19.3682 6.46937 19.9927 6.91879 20.3137C7.3682 20.6347 7.99275 20.5307 8.31376 20.0812L11.3471 15.8345L10.5136 20.8356C10.4228 21.3804 10.7909 21.8956 11.3356 21.9864C11.8804 22.0772 12.3956 21.7092 12.4864 21.1644L13.2883 16.3532L15.6588 20.0408C15.9575 20.5053 16.5762 20.6398 17.0408 20.3412C17.5054 20.0425 17.6399 19.4238 17.3412 18.9592L15.5553 16.1812L18.3217 18.7348C18.7276 19.1094 19.3602 19.0841 19.7348 18.6783C20.1094 18.2725 20.0841 17.6398 19.6783 17.2652L16.6427 14.4631L20.876 14.9923C21.424 15.0608 21.9238 14.6721 21.9923 14.124C22.0608 13.576 21.6721 13.0762 21.1241 13.0077L16.9342 12.484L21.2291 11.4734C21.7667 11.3469 22.0999 10.8086 21.9734 10.271C21.8469 9.73336 21.3086 9.40009 20.771 9.52659L15.1819 10.8417L19.2863 5.61783C19.6276 5.18356 19.5521 4.5549 19.1178 4.21369C18.6836 3.87247 18.0549 3.94791 17.7137 4.38218L13.8574 9.29015L14.738 3.65438C14.8233 3.10872 14.4501 2.59725 13.9044 2.51199C13.3587 2.42673 12.8473 2.79996 12.762 3.34563L11.876 9.01594L8.64445 2.55279Z"/></svg>';

const SVG_GEMINI =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81Z"/></svg>';

const SVG_CURSOR =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>';

const SVG_COPILOT =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z"/></svg>';

const SVG_PERPLEX =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"/></svg>';

/* ────────────────────────────────────────────────────────────
   Sessions: ChatGPT → Claude → Gemini cycle (verbatim from demo)
   ──────────────────────────────────────────────────────────── */

interface Session {
  brand: string;
  title: string;
  model: string;
  accent: string;
  glow: string;
  placeholder: string;
  markSvg: string;
  q: string;
  intro: string;
  highlight: string;
  rest: string;
  table: [string, string][];
  time: string;
}

const sessions: Session[] = [
  {
    brand: "chatgpt",
    title: "CHATGPT",
    model: "GPT-4o",
    accent: "#10A37F",
    glow: "rgba(16,163,127,0.18)",
    placeholder: "Message ChatGPT...",
    markSvg: SVG_CHATGPT,
    q: "Which keywords are bringing me the most traffic right now?",
    intro: "Top 5 by impressions this week. ",
    highlight: "/blog/seo-checklist",
    rest: " is leading at 24,531 impressions. Position trending up across the board:",
    table: [
      ["seo audit checklist", "24,531 impr"],
      ["claude mcp setup", "18,209 impr"],
      ["ga4 vs ua differences", "12,847 impr"],
    ],
    time: "0.39s",
  },
  {
    brand: "claude",
    title: "CLAUDE",
    model: "Claude Sonnet 4.5",
    accent: "#D97757",
    glow: "rgba(217,119,87,0.18)",
    placeholder: "Reply to Claude...",
    markSvg: SVG_CLAUDE,
    q: "How is the new pricing page converting compared to last quarter?",
    intro: "Conversion rate is now ",
    highlight: "6.4%",
    rest: ", up from 4.1% last quarter. Engagement metrics are strong across the funnel:",
    table: [
      ["Signups (last 7 days)", "234"],
      ["Avg time on page", "2m 14s"],
      ["Bounce rate change", "-18%"],
    ],
    time: "0.42s",
  },
  {
    brand: "gemini",
    title: "GEMINI",
    model: "Gemini 2.0 Pro",
    accent: "#4285F4",
    glow: "rgba(66,133,244,0.18)",
    placeholder: "Ask Gemini...",
    markSvg: SVG_GEMINI,
    q: "Which pages should I update for SEO this week?",
    intro: "Three pages flagged. Top opportunity: ",
    highlight: "/features/mcp",
    rest: " ranks #11 for a 4,200/mo keyword. One small refresh could push it to page one:",
    table: [
      ["/features/mcp", "Position #11"],
      ["/guides/claude-setup", "-3 positions"],
      ["/blog/ga4-faq", "0 indexed pages"],
    ],
    time: "0.48s",
  },
];

/* ────────────────────────────────────────────────────────────
   Chat App component (cycles through 3 AIs)
   ──────────────────────────────────────────────────────────── */

function ChatApp() {
  const appRef = useRef<HTMLDivElement>(null);
  const userWrapRef = useRef<HTMLDivElement>(null);
  const userTextRef = useRef<HTMLSpanElement>(null);
  const thinkWrapRef = useRef<HTMLDivElement>(null);
  const thinkAvatarRef = useRef<HTMLDivElement>(null);
  const aiWrapRef = useRef<HTMLDivElement>(null);
  const aiAvatarRef = useRef<HTMLDivElement>(null);
  const aiTextRef = useRef<HTMLDivElement>(null);
  const aiTableRef = useRef<HTMLDivElement>(null);
  const aiTimeRef = useRef<HTMLSpanElement>(null);
  const modelMarkRef = useRef<HTMLSpanElement>(null);
  const modelNameRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const applySession = (s: Session) => {
      const app = appRef.current;
      if (!app) return;
      app.dataset.brand = s.brand;
      app.style.setProperty("--brand-accent", s.accent);
      app.style.setProperty("--brand-glow", s.glow);
      if (modelMarkRef.current) modelMarkRef.current.innerHTML = s.markSvg;
      if (modelNameRef.current) modelNameRef.current.textContent = s.model;
      if (inputRef.current) inputRef.current.placeholder = s.placeholder;
      if (aiAvatarRef.current) aiAvatarRef.current.innerHTML = s.markSvg;
      if (thinkAvatarRef.current) thinkAvatarRef.current.innerHTML = s.markSvg;
      if (badgeRef.current)
        badgeRef.current.textContent = `VIA OMG · BRIDGE → ${s.title}`;
    };

    const buildTable = (rows: [string, string][]) => {
      let html = '<table class="chat-table">';
      for (const [k, v] of rows) html += `<tr><td>${k}</td><td>${v}</td></tr>`;
      return html + "</table>";
    };

    const resetChat = () => {
      [userWrapRef, thinkWrapRef, aiWrapRef].forEach((r) =>
        r.current?.classList.remove("visible")
      );
      if (userTextRef.current) userTextRef.current.innerHTML = "";
      if (aiTextRef.current) aiTextRef.current.innerHTML = "";
      if (aiTableRef.current) aiTableRef.current.innerHTML = "";
      if (aiTimeRef.current) aiTimeRef.current.textContent = "—";
    };

    let sIdx = 0;

    const runCycle = async (): Promise<void> => {
      if (cancelled) return;
      resetChat();
      const s = sessions[sIdx];
      applySession(s);

      await sleep(280);
      if (cancelled) return;

      if (userTextRef.current) userTextRef.current.textContent = s.q;
      userWrapRef.current?.classList.add("visible");
      await sleep(650);
      if (cancelled) return;

      thinkWrapRef.current?.classList.add("visible");
      await sleep(800);
      if (cancelled) return;
      thinkWrapRef.current?.classList.remove("visible");
      await sleep(140);
      if (cancelled) return;

      aiWrapRef.current?.classList.add("visible");
      if (aiTextRef.current) {
        aiTextRef.current.innerHTML = `${s.intro}<span class="highlight">${s.highlight}</span>${s.rest}`;
      }
      await sleep(260);
      if (cancelled) return;
      if (aiTableRef.current) aiTableRef.current.innerHTML = buildTable(s.table);
      await sleep(140);
      if (aiTimeRef.current) aiTimeRef.current.textContent = s.time;

      await sleep(3000);
      if (cancelled) return;

      userWrapRef.current?.classList.remove("visible");
      aiWrapRef.current?.classList.remove("visible");
      await sleep(500);
      if (cancelled) return;

      sIdx = (sIdx + 1) % sessions.length;
      runCycle();
    };

    const t = setTimeout(runCycle, 1100);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="chat-app reveal" data-brand="chatgpt" ref={appRef} style={{ animationDelay: ".18s" }}>
      <div className="brand-strip" />
      <div className="chat-chrome">
        <div className="dots">
          <span />
          <span />
          <span />
        </div>
        <div className="model">
          <span ref={modelMarkRef} />
          <span ref={modelNameRef}>GPT-4o</span>
          <span className="caret">▾</span>
        </div>
        <div className="status">CONNECTED</div>
      </div>

      <div className="chat-thread">
        <div className="chat-msg user" ref={userWrapRef}>
          <div className="msg-content">
            <span ref={userTextRef} />
          </div>
        </div>

        <div className="chat-msg ai thinking" ref={thinkWrapRef}>
          <div className="msg-avatar" ref={thinkAvatarRef} />
          <div className="msg-content">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>

        <div className="chat-msg ai" ref={aiWrapRef}>
          <div className="msg-avatar" ref={aiAvatarRef} />
          <div className="msg-content">
            <div ref={aiTextRef} />
            <div ref={aiTableRef} />
            <div className="meta">
              <span className="badge" ref={badgeRef}>
                VIA OMG · BRIDGE → CHATGPT
              </span>
              <span>
                <span ref={aiTimeRef}>—</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          ref={inputRef}
          placeholder="Message ChatGPT..."
          disabled
        />
        <button className="send" type="button">
          SEND →
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Demo Modal (enquiry form)
   ──────────────────────────────────────────────────────────── */

function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.classList.add("modal-open");
    document.addEventListener("keydown", handler);
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      // reset form when closed
      const t = setTimeout(() => setSubmitted(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <button
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        {!submitted ? (
          <>
            <div className="modal-meta">
              <span className="num">DEMO</span>
              <span>·</span>
              <span>BOOK A WALKTHROUGH</span>
            </div>
            <h3 className="modal-title">
              See it on <span className="accent">your data.</span>
            </h3>
            <p className="modal-lede">
              We&apos;ll set up a personalized walkthrough using your GA4 and
              Search Console properties. Ask real questions, see real answers,
              all live.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="field">
                <label>NAME</label>
                <input type="text" name="name" required autoComplete="name" />
              </div>
              <div className="field">
                <label>WORK EMAIL</label>
                <input type="email" name="email" required autoComplete="email" />
              </div>
              <div className="field">
                <label>COMPANY</label>
                <input type="text" name="company" autoComplete="organization" />
              </div>
              <div className="field">
                <label>WHAT DO YOU WANT TO ASK YOUR DATA?</label>
                <textarea
                  name="question"
                  rows={3}
                  placeholder="e.g. why did organic dip last week, which keywords are converting best, ..."
                />
              </div>
              <button type="submit" className="btn btn-primary">
                REQUEST DEMO →
              </button>
            </form>
          </>
        ) : (
          <div className="modal-success">
            <div className="check">✓</div>
            <h3>Got it.</h3>
            <p>
              We&apos;ll be in touch within one business day to schedule your
              walkthrough. Check your inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   AI Logo cell (used in WORKS WITH bar)
   ──────────────────────────────────────────────────────────── */

function AiLogo({ svg, name, tag }: { svg: string; name: string; tag: string }) {
  return (
    <div className="ai-logo">
      <span
        className="ai-logo-svg"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="name">{name}</div>
      <div className="tag">{tag}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function MarketingHomePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = () => setDemoOpen(true);
  const closeDemo = () => setDemoOpen(false);

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-main">
          <div className="reveal hero-text">
            <h1>
              Talk to your <span className="underline">data</span>{" "}
              <span className="accent">in any AI.</span>
            </h1>
            <p className="lede">
              Connect Google Analytics, Search Console and Business Profile to
              ChatGPT, Claude or Gemini in 90 seconds. Ask anything about your
              traffic, rankings or conversions. Get the answer in plain
              English.
            </p>
            <div className="ctas">
              <Link href="/onboarding" className="btn btn-primary">
                Start Free →
              </Link>
              <button
                type="button"
                className="btn"
                onClick={openDemo}
              >
                View Demo
              </button>
            </div>
            <div className="trust">
              <span>
                <span className="dot" />
                4,820+ marketers
              </span>
              <span>
                <span className="dot" />
                Setup in 90 seconds
              </span>
              <span>
                <span className="dot" />
                No credit card
              </span>
            </div>
          </div>

          <div className="hero-chat">
            <ChatApp />
          </div>
        </div>
      </section>

      {/* ── RIBBON · WHO IT'S FOR ─────────────────────────── */}
      <section className="ribbon">
        <div className="marquee">
          <div className="marquee-track">
            {[
              "SEO MANAGERS",
              "MARKETING DIRECTORS",
              "CONTENT STRATEGISTS",
              "AGENCY OWNERS",
              "GROWTH MARKETERS",
              "PERFORMANCE MARKETERS",
              "IN-HOUSE TEAMS",
              "DATA ANALYSTS",
              "FOUNDERS",
              "FREELANCE CONSULTANTS",
              "SEO MANAGERS",
              "MARKETING DIRECTORS",
              "CONTENT STRATEGISTS",
              "AGENCY OWNERS",
              "GROWTH MARKETERS",
              "PERFORMANCE MARKETERS",
              "IN-HOUSE TEAMS",
              "DATA ANALYSTS",
              "FOUNDERS",
              "FREELANCE CONSULTANTS",
            ].map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI BAR · WORKS WITH ───────────────────────────── */}
      <section className="ai-bar">
        <AiLogo svg={SVG_CHATGPT} name="CHATGPT" tag="CUSTOM GPT" />
        <AiLogo svg={SVG_CLAUDE} name="CLAUDE" tag="MCP · API" />
        <AiLogo svg={SVG_GEMINI} name="GEMINI" tag="FUNCTION CALL" />
        <AiLogo svg={SVG_CURSOR} name="CURSOR" tag="MCP" />
        <AiLogo svg={SVG_COPILOT} name="COPILOT" tag="VS CODE EXT" />
        <AiLogo svg={SVG_PERPLEX} name="PERPLEX" tag="API" />
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="section">
        <div className="section-body">
          <h2>
            Three steps. <span className="accent">Ninety seconds.</span>
            <br />
            Then ask <span className="underline">anything.</span>
          </h2>

          <div className="modules">
            <div className="module">
              <div className="number">01</div>
              <div className="label">CONNECT</div>
              <h3>Sign in with Google</h3>
              <p>
                One click connects Analytics, Search Console and Business
                Profile. Read-only scopes only. Nothing leaves Google&apos;s
                servers without your prompt.
              </p>
            </div>
            <div className="module">
              <div className="number">02</div>
              <div className="label">CONFIGURE</div>
              <h3>Pick what to expose</h3>
              <p>
                Toggle the GA4 properties, GSC sites and locations each
                teammate can query. Different scopes for different roles.
                Audit-ready by default.
              </p>
            </div>
            <div className="module">
              <div className="number">03</div>
              <div className="label">QUERY</div>
              <h3>Drop in. Ask away.</h3>
              <p>
                Paste your endpoint into Claude, ChatGPT, Cursor or any
                MCP-aware tool. Then ask anything. Get the answer in plain
                English.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ──────────────────────────────────── */}
      <section className="section">
        <div className="section-body">
          <h2>
            Built for the <span className="accent">questions</span>
            <br />
            your dashboard never answered.
          </h2>

          <div className="featured-grid">
            <article className="feat tall">
              <div className="tag">▣ FEATURED</div>
              <h4>The conversation your team was already having.</h4>
              <p>
                Slack threads asking &quot;wait, why did organic dip last
                week?&quot; Now the AI assistant on the other end can actually
                answer. It pulls live GA4, GSC and CrUX data, joins it in one
                query, and explains the why.
              </p>
              <ul>
                <li>Plain-English answers from live Google data</li>
                <li>Joins traffic, performance and indexing in one query</li>
                <li>
                  Works in ChatGPT, Claude, Gemini, Cursor, custom agents
                </li>
                <li>Per-property scopes. Read-only. Audit-ready.</li>
              </ul>
            </article>
            <article className="feat">
              <div className="tag">+ INSIGHT</div>
              <h4>Branded reports. Sent on schedule.</h4>
              <p>
                Auto-generated weekly HTML reports in your colors and font.
                Drop into client Slack, email or shared drive. No slide deck
                required.
              </p>
            </article>
            <article className="feat">
              <div className="tag">+ AUTOMATION</div>
              <h4>Prompt library. One-click reports.</h4>
              <p>
                Save SEO audits, conversion checks and rank-tracking prompts.
                Run them from any AI assistant on demand or on a schedule.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── METRICS ───────────────────────────────────────── */}
      <section className="stats">
        <div className="stat">
          <div className="num">90s</div>
          <div className="label">From signup to first answer</div>
        </div>
        <div className="stat">
          <div className="num teal">11</div>
          <div className="label">Google APIs connected</div>
        </div>
        <div className="stat">
          <div className="num">99.9%</div>
          <div className="label">Uptime · last 30 days</div>
        </div>
        <div className="stat">
          <div className="num vermilion">0.42s</div>
          <div className="label">Avg query response time</div>
        </div>
      </section>

      {/* ── POSTER MANIFESTO ──────────────────────────────── */}
      <section className="poster">
        <div className="poster-body">
          <div className="big">
            YOUR DATA.
            <br />
            <span className="a">YOUR</span> <span className="b">QUESTIONS.</span>
          </div>
          <div className="stamp">
            <Link href="/onboarding" className="btn btn-primary">
              Start Free →
            </Link>
            <div className="tagline">
              No credit card
              <br />
              90 second setup
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (CTA + 4-COL + BOTTOM) ────────────────── */}
      <footer className="site-footer">
        <div className="footer-body">
          <div className="footer-cta">
            <div>
              <h5>
                Stop digging. <span className="accent">Start asking.</span>
              </h5>
              <p>
                Free to start. No credit card. Connect Google in 90 seconds.
              </p>
              <Link href="/onboarding" className="btn btn-primary">
                Start Free →
              </Link>
            </div>
          </div>

          <div className="footer-grid">
            <div className="col brand-col">
              <Image
                src="/omg-logo-light.webp"
                alt="OMG / BRIDGE"
                width={160}
                height={32}
                className="footer-logo"
              />
              <p>
                The bridge between your Google data and any AI assistant. No
                SQL. No dashboards. Just answers.
              </p>
            </div>
            <div className="col">
              <h6>PRODUCT</h6>
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/#how-it-works">How it works</Link>
            </div>
            <div className="col">
              <h6>RESOURCES</h6>
              <Link href="/guides">Documentation</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
            <div className="col">
              <h6>COMPANY</h6>
              <a href="https://wodo.digital" target="_blank" rel="noreferrer">About</a>
              <Link href="/contact">Contact</Link>
              <button
                type="button"
                className="footer-link-btn"
                onClick={openDemo}
              >
                Request demo
              </button>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} OMG · BRIDGE · BENGALURU</div>
            <div>
              BUILT BY{" "}
              <a href="https://wodo.digital" target="_blank" rel="noreferrer">
                WODO DIGITAL
              </a>
            </div>
          </div>
        </div>
      </footer>

      <DemoModal open={demoOpen} onClose={closeDemo} />

      <style jsx global>{`
        /* ── hero ─────────────────────────────────────────── */
        .hero {
          position: relative;
          z-index: 2;
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .hero-main {
          padding: 56px 56px 64px;
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 56px;
          align-items: center;
        }
        .hero-text { order: 0; }
        .hero-chat { order: 0; }
        .hero h1 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(44px, 5.8vw, 70px);
          line-height: 1.0;
          letter-spacing: -0.035em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .hero h1 .accent { color: var(--vermilion); }
        .hero h1 .underline {
          text-decoration: underline;
          text-decoration-color: var(--teal);
          text-decoration-thickness: 4px;
          text-underline-offset: 6px;
        }
        .hero .lede {
          font-size: 16px;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 480px;
          margin-bottom: 32px;
        }
        .hero .ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .hero .trust {
          display: flex;
          gap: 22px;
          flex-wrap: wrap;
          font-size: 11px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .hero .trust span { display: inline-flex; align-items: center; gap: 8px; }
        .hero .trust .dot {
          width: 6px;
          height: 6px;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          border-radius: 50%;
        }

        /* ── chat app ─────────────────────────────────────── */
        .chat-app {
          position: relative;
          background: var(--surface-1);
          border: 1px solid var(--rule-strong);
          align-self: stretch;
          min-height: 540px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          box-shadow:
            0 30px 80px -20px rgba(0, 0, 0, 0.6),
            0 0 80px var(--brand-glow);
          overflow: hidden;
          transition: box-shadow 0.6s ease;
        }
        .chat-app::after {
          content: "";
          position: absolute;
          top: -10px;
          right: -10px;
          width: 88px;
          height: 88px;
          background: var(--vermilion);
          z-index: -1;
        }
        .chat-app .brand-strip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--brand-accent);
          z-index: 5;
          box-shadow: 0 0 12px var(--brand-glow);
        }
        .chat-chrome {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 14px 16px 12px;
          border-bottom: 1px solid var(--rule);
          background: var(--surface-2);
        }
        .chat-chrome .dots { display: flex; gap: 6px; }
        .chat-chrome .dots span {
          width: 8px; height: 8px; background: var(--ink-3); border-radius: 50%;
        }
        .chat-chrome .dots span:nth-child(1) { background: var(--teal); }
        .chat-chrome .dots span:nth-child(2) { background: var(--amber); }
        .chat-chrome .model {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--body);
          font-weight: 500;
          font-size: 12.5px;
          color: var(--ink);
          transition: color 0.3s ease;
        }
        .chat-chrome .model svg {
          width: 16px;
          height: 16px;
          color: var(--brand-accent);
          transition: color 0.3s ease;
        }
        .chat-chrome .model .caret { color: var(--ink-3); font-size: 10px; }
        .chat-chrome .status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--brand-accent);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }
        .chat-chrome .status::before {
          content: "";
          width: 6px;
          height: 6px;
          background: var(--brand-accent);
          box-shadow: 0 0 8px var(--brand-accent);
          border-radius: 50%;
          animation: pulse 2.4s ease-in-out infinite;
          transition: background 0.3s ease;
        }

        .chat-thread {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-height: 380px;
          overflow: hidden;
        }
        .chat-msg {
          display: flex;
          gap: 12px;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .chat-msg.visible { opacity: 1; transform: translateY(0); }
        .chat-msg.user { justify-content: flex-end; }
        .chat-msg.user .msg-content {
          background: var(--surface-2);
          border: 1px solid var(--rule-strong);
          padding: 10px 14px;
          max-width: 78%;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--ink);
        }
        .chat-msg.ai { justify-content: flex-start; }
        .chat-msg.ai .msg-avatar {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: var(--surface-2);
          border: 1px solid var(--brand-accent);
          color: var(--brand-accent);
          display: grid;
          place-items: center;
          transition: border-color 0.3s ease, color 0.3s ease;
        }
        .chat-msg.ai .msg-avatar svg { width: 16px; height: 16px; }
        .chat-msg.ai .msg-content {
          flex: 1;
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--ink);
        }
        .chat-msg.ai .msg-content .highlight {
          color: var(--brand-accent);
          font-weight: 600;
          transition: color 0.3s ease;
        }
        .chat-msg.ai .chat-table {
          margin-top: 12px;
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        .chat-msg.ai .chat-table td {
          padding: 7px 0;
          border-bottom: 1px solid var(--rule);
          color: var(--ink-2);
          font-variant-numeric: tabular-nums;
        }
        .chat-msg.ai .chat-table td:last-child {
          text-align: right;
          color: var(--brand-accent);
          font-weight: 500;
          transition: color 0.3s ease;
        }
        .chat-msg.ai .meta {
          margin-top: 14px;
          display: flex;
          gap: 18px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .chat-msg.ai .meta .badge {
          color: var(--brand-accent);
          transition: color 0.3s ease;
        }
        .chat-msg.thinking .msg-content {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 10px 0;
        }
        .chat-msg.thinking .dot {
          width: 6px;
          height: 6px;
          background: var(--brand-accent);
          border-radius: 50%;
          opacity: 0.4;
          animation: thinkPulse 1.4s ease-in-out infinite;
          transition: background 0.3s ease;
        }
        .chat-msg.thinking .dot:nth-child(2) { animation-delay: 0.18s; }
        .chat-msg.thinking .dot:nth-child(3) { animation-delay: 0.36s; }

        .chat-input {
          padding: 14px 16px;
          border-top: 1px solid var(--rule);
          background: var(--surface-2);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chat-input input {
          flex: 1;
          background: var(--bg);
          border: 1px solid var(--rule);
          color: var(--ink);
          padding: 10px 14px;
          font-family: var(--body);
          font-size: 13px;
          outline: none;
          transition: border-color 0.18s;
        }
        .chat-input input:focus { border-color: var(--brand-accent); }
        .chat-input input::placeholder { color: var(--ink-3); }
        .chat-input .send {
          background: var(--brand-accent);
          border: none;
          color: #fff;
          padding: 10px 14px;
          font-family: var(--body);
          font-weight: 600;
          letter-spacing: 0.05em;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .chat-input .send:hover { background: var(--vermilion); color: #fff; }

        /* ── ribbon ───────────────────────────────────────── */
        .ribbon {
          display: block;
          border-bottom: 1px solid var(--rule);
          background: var(--bg);
        }

        /* ── ai bar ───────────────────────────────────────── */
        .ai-bar {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          border-bottom: 1px solid var(--rule);
          background: var(--surface-1);
        }
        .ai-logo {
          padding: 28px 22px;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: background 0.2s ease;
        }
        .ai-logo:last-child { border-right: none; }
        .ai-logo:hover { background: var(--surface-2); }
        .ai-logo .ai-logo-svg svg {
          width: 28px;
          height: 28px;
          color: var(--ink);
          transition: color 0.2s ease, transform 0.2s ease;
          display: block;
        }
        .ai-logo:hover .ai-logo-svg svg {
          color: var(--teal);
          transform: scale(1.05);
        }
        .ai-logo .name {
          font-family: var(--display);
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.015em;
          text-transform: uppercase;
          line-height: 1;
        }
        .ai-logo .tag {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-3);
        }

        /* ── stats ────────────────────────────────────────── */
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--rule);
          background: var(--bg);
        }
        .stat {
          padding: 26px 24px;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .stat:last-child { border-right: none; }
        .stat .num {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(32px, 4vw, 46px);
          line-height: 1;
          letter-spacing: -0.04em;
          font-variant-numeric: tabular-nums;
        }
        .stat .num.teal { color: var(--teal); }
        .stat .num.vermilion { color: var(--vermilion); }
        .stat .label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-top: 2px;
        }

        /* ── section ──────────────────────────────────────── */
        .section {
          display: block;
          border-bottom: 1px solid var(--rule);
        }
        .section .section-body { padding: 64px 56px 80px; }
        .section h2 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(28px, 3.6vw, 42px);
          line-height: 1.05;
          letter-spacing: -0.035em;
          text-transform: uppercase;
          margin-bottom: 56px;
          max-width: 820px;
        }
        .section h2 .accent { color: var(--vermilion); }
        .section h2 .underline {
          text-decoration: underline;
          text-decoration-color: var(--teal);
          text-decoration-thickness: 3px;
          text-underline-offset: 5px;
        }

        /* ── modules ──────────────────────────────────────── */
        .modules {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--rule-strong);
        }
        .module {
          border-right: 1px solid var(--rule-strong);
          padding: 32px;
          background: var(--surface-1);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: background 0.22s ease, color 0.22s ease;
        }
        .module:last-child { border-right: none; }
        .module:nth-child(2) { background: var(--surface-2); }
        .module:hover { background: var(--teal); color: var(--bg); }
        .module:hover .number { color: var(--bg); }
        .module:hover .label {
          color: rgba(10, 16, 24, 0.65);
          border-color: rgba(10, 16, 24, 0.18);
        }
        .module:hover p { color: rgba(10, 16, 24, 0.85); }
        .module .number {
          font-family: var(--display);
          font-weight: 700;
          font-size: 56px;
          line-height: 0.9;
          letter-spacing: -0.04em;
          color: var(--teal);
          transition: color 0.22s ease;
        }
        .module .label {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          padding-bottom: 12px;
          border-bottom: 1px solid var(--rule);
          transition: color 0.22s ease, border-color 0.22s ease;
        }
        .module h3 {
          font-family: var(--display);
          font-weight: 700;
          font-size: 22px;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          line-height: 1.1;
        }
        .module p {
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.65;
          transition: color 0.22s ease;
        }

        /* ── featured ─────────────────────────────────────── */
        .featured-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          grid-template-rows: auto auto;
          border: 1px solid var(--rule-strong);
        }
        .feat {
          padding: 36px;
          background: var(--surface-1);
          border-right: 1px solid var(--rule-strong);
          border-bottom: 1px solid var(--rule-strong);
        }
        .feat:nth-child(2),
        .feat:nth-child(3) { border-right: none; }
        .feat:nth-child(3) { border-bottom: none; }
        .feat.tall {
          grid-row: span 2;
          border-bottom: none;
          background: var(--bg);
          border-right: 1px solid rgba(0, 181, 181, 0.5);
          box-shadow: inset 4px 0 0 var(--teal);
          padding-left: 40px;
        }
        .feat .tag {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--vermilion);
          margin-bottom: 18px;
        }
        .feat.tall .tag { color: var(--teal-bright); }
        .feat h4 {
          font-family: var(--display);
          font-weight: 700;
          font-size: 24px;
          line-height: 1.1;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .feat.tall h4 { font-size: 32px; }
        .feat p { font-size: 13px; line-height: 1.65; color: var(--ink-2); }
        .feat ul { list-style: none; margin-top: 22px; padding: 0; }
        .feat ul li {
          padding: 10px 0;
          border-bottom: 1px solid var(--rule);
          font-size: 13px;
          display: flex;
          gap: 14px;
          color: var(--ink-2);
        }
        .feat ul li::before {
          content: "+";
          color: var(--teal-bright);
          font-weight: 600;
        }

        /* ── poster ───────────────────────────────────────── */
        .poster {
          position: relative;
          display: block;
          border-bottom: 1px solid var(--rule);
          background: var(--bg);
          overflow: hidden;
        }
        .poster::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 22% 50%, var(--teal-glow), transparent 55%),
            radial-gradient(circle at 78% 50%, var(--vermilion-glow), transparent 55%);
          pointer-events: none;
        }
        .poster .poster-body {
          padding: 110px 56px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 56px;
          align-items: end;
          position: relative;
          z-index: 1;
        }
        .poster .big {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(56px, 9vw, 132px);
          line-height: 0.92;
          letter-spacing: -0.045em;
          text-transform: uppercase;
        }
        .poster .big .a {
          color: var(--teal-bright);
          text-shadow: 0 0 30px var(--teal-glow);
        }
        .poster .big .b {
          color: var(--vermilion);
          text-shadow: 0 0 30px var(--vermilion-glow);
        }
        .poster .stamp {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          text-align: right;
        }
        .poster .stamp .tagline {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          line-height: 1.85;
        }

        /* ── footer ───────────────────────────────────────── */
        .site-footer {
          display: block;
          background: var(--bg);
        }
        .site-footer .footer-body {
          padding: 80px 56px 32px;
          display: flex;
          flex-direction: column;
          gap: 64px;
        }
        .footer-cta {
          padding-bottom: 56px;
          border-bottom: 1px solid var(--rule);
        }
        .footer-cta h5 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(36px, 4.6vw, 60px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          max-width: 600px;
          margin-bottom: 18px;
        }
        .footer-cta h5 .accent { color: var(--vermilion); }
        .footer-cta p {
          color: var(--ink-2);
          font-size: 14px;
          max-width: 460px;
          margin-bottom: 22px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(3, 1fr);
          gap: 48px;
          padding-bottom: 56px;
          border-bottom: 1px solid var(--rule);
        }
        .footer-grid .col h6 {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--rule);
        }
        .footer-grid .col a,
        .footer-grid .col .footer-link-btn {
          display: block;
          color: var(--ink-2);
          text-decoration: none;
          font-size: 13px;
          padding: 6px 0;
          transition: color 0.18s;
          background: none;
          border: none;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .footer-grid .col a:hover,
        .footer-grid .col .footer-link-btn:hover { color: var(--teal); }

        .brand-col .footer-logo {
          height: 32px;
          width: auto;
          margin-bottom: 18px;
          display: block;
        }
        .brand-col p {
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.6;
          max-width: 280px;
          margin-bottom: 18px;
        }
        .footer-status {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--teal);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .footer-bottom a { color: var(--ink-3); text-decoration: none; }
        .footer-bottom a:hover { color: var(--teal); }

        /* ── modal ────────────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 16, 24, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 200;
          display: grid;
          place-items: center;
          padding: 32px;
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .modal-overlay.visible { opacity: 1; pointer-events: auto; }
        .modal-card {
          background: var(--surface-1);
          border: 1px solid var(--rule-strong);
          width: 100%;
          max-width: 540px;
          padding: 44px 40px;
          position: relative;
          transform: translateY(20px);
          transition: transform 0.35s ease;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-overlay.visible .modal-card { transform: translateY(0); }
        .modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          background: none;
          border: 1px solid var(--rule-strong);
          color: var(--ink-2);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.18s;
          display: grid;
          place-items: center;
          font-family: inherit;
        }
        .modal-close:hover {
          color: var(--vermilion);
          border-color: var(--vermilion);
        }
        .modal-meta {
          display: flex;
          gap: 14px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 18px;
        }
        .modal-meta .num { color: var(--vermilion); }
        .modal-title {
          font-family: var(--display);
          font-weight: 700;
          font-size: 32px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .modal-title .accent { color: var(--teal); }
        .modal-lede {
          font-size: 14px;
          color: var(--ink-2);
          line-height: 1.65;
          margin-bottom: 28px;
        }
        .modal-card .field { margin-bottom: 18px; }
        .modal-card .field label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 6px;
        }
        .modal-card .field input,
        .modal-card .field textarea {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--rule);
          color: var(--ink);
          padding: 11px 13px;
          font-family: var(--body);
          font-size: 14px;
          outline: none;
          transition: border-color 0.18s;
        }
        .modal-card .field input:focus,
        .modal-card .field textarea:focus { border-color: var(--teal); }
        .modal-card .field textarea { resize: vertical; min-height: 80px; }
        .modal-card form .btn {
          width: 100%;
          padding: 16px 22px;
          margin-top: 8px;
          justify-content: center;
        }
        .modal-success { text-align: center; padding: 40px 0; }
        .modal-success .check {
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
        .modal-success h3 {
          font-family: var(--display);
          font-weight: 700;
          font-size: 28px;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .modal-success p {
          font-size: 14px;
          color: var(--ink-2);
          line-height: 1.6;
          max-width: 360px;
          margin: 0 auto;
        }

        /* ── responsive ───────────────────────────────────── */
        @media (max-width: 980px) {
          .hero-main {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 32px 20px;
          }
          .hero-text { order: 2; }
          .hero-chat { order: 1; }
          .section .section-body { padding: 40px 20px 56px; }

          .ai-bar { grid-template-columns: 1fr 1fr; }
          .ai-logo { border-bottom: 1px solid var(--rule); }
          .ai-logo:nth-child(odd) { border-right: 1px solid var(--rule); }
          .ai-logo:nth-child(even) { border-right: none; }
          .ai-logo:nth-last-child(-n + 2) { border-bottom: none; }

          .stats { grid-template-columns: 1fr 1fr; }
          .stat:nth-child(odd) { border-right: 1px solid var(--rule); }
          .stat:nth-child(even) { border-right: none; }
          .stat:nth-child(2),
          .stat:nth-child(3) { border-bottom: 1px solid var(--rule); }

          .modules { grid-template-columns: 1fr; }
          .module {
            border-right: none;
            border-bottom: 1px solid var(--rule-strong);
          }
          .module:last-child { border-bottom: none; }

          .featured-grid { grid-template-columns: 1fr; }
          .feat,
          .feat.tall {
            border-right: none;
            border-bottom: 1px solid var(--rule-strong);
            grid-row: auto;
            padding-left: 36px;
          }
          .feat:last-child { border-bottom: none; }

          .poster .poster-body {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 64px 20px;
          }
          .poster .stamp { text-align: left; align-items: flex-start; }

          .site-footer .footer-body { padding: 48px 20px 32px; gap: 48px; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
          .footer-bottom { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </>
  );
}
