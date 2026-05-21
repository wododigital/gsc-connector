import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks - OMG Bridge",
  description: "Your enquiry was received. Our team will be in touch shortly.",
};

export default function ThankYouPage() {
  return (
    <div className="thanks-shell">
      <section className="thanks-body">
        <div className="section-eyebrow">
          <span>PRO PLAN · ENQUIRY</span>
          <span className="rule" />
        </div>
        <h1>
          Thanks. <span className="accent">We&rsquo;re on it.</span>
        </h1>
        <p className="lede">
          Your request has been received. Our team will reach out shortly to schedule a short demo
          and activate your subscription.
        </p>

        <ol className="thanks-steps">
          <li>
            <span className="num">01</span>
            <div>
              <h3>Confirmation</h3>
              <p>
                Look out for a confirmation email at the address you provided. If you don&rsquo;t
                see it within a few minutes, check your spam folder.
              </p>
            </div>
          </li>
          <li>
            <span className="num">02</span>
            <div>
              <h3>Short demo</h3>
              <p>
                A teammate will reach out to book a 20-minute walkthrough tailored to your stack -
                Search Console, GA4, or Business Profile.
              </p>
            </div>
          </li>
          <li>
            <span className="num">03</span>
            <div>
              <h3>Activation</h3>
              <p>
                Once we have your green light, we&rsquo;ll activate your Pro subscription on the
                account you sign in with.
              </p>
            </div>
          </li>
        </ol>

        <div className="thanks-actions">
          <Link href="/" className="btn">
            BACK TO HOME
          </Link>
          <Link href="/dashboard" className="btn btn-primary">
            GO TO DASHBOARD →
          </Link>
        </div>
      </section>

      <style>{`
        .thanks-shell { min-height: 100%; }
        .thanks-body {
          padding: 72px 56px 96px;
          max-width: 920px;
        }
        .thanks-body h1 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(40px, 5.4vw, 64px);
          line-height: 1.0;
          letter-spacing: -0.035em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .thanks-body h1 .accent { color: var(--vermilion); }
        .thanks-body .lede {
          font-size: 16px;
          line-height: 1.65;
          color: var(--ink-2);
          max-width: 620px;
          margin-bottom: 48px;
        }
        .thanks-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 48px;
          display: grid;
          gap: 0;
          border: 1px solid var(--rule-strong);
          background: var(--surface-1);
        }
        .thanks-steps li {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 24px;
          padding: 24px 28px;
          border-bottom: 1px solid var(--rule);
          align-items: start;
        }
        .thanks-steps li:last-child { border-bottom: none; }
        .thanks-steps .num {
          font-family: var(--display);
          font-weight: 700;
          font-size: 28px;
          letter-spacing: -0.02em;
          color: var(--teal);
          font-variant-numeric: tabular-nums;
        }
        .thanks-steps h3 {
          font-family: var(--display);
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--ink);
          margin: 0 0 6px;
        }
        .thanks-steps p {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--ink-2);
          margin: 0;
        }
        .thanks-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 720px) {
          .thanks-body { padding: 48px 20px 64px; }
          .thanks-steps li { grid-template-columns: 1fr; gap: 8px; }
        }
      `}</style>
    </div>
  );
}
