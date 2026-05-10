import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in - OMG Bridge",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; return_to?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Google denied or user cancelled at consent screen
  access_denied: "Sign-in was cancelled. Please try again.",
  google_denied: "Sign-in was cancelled. Please try again.",
  // No authorization code returned
  no_code: "Sign-in failed - no code received from Google. Please try again.",
  missing_code: "Sign-in failed - no code received from Google. Please try again.",
  // CSRF state mismatch - usually a stale or missing cookie
  state_mismatch: "Sign-in session expired. Please try again.",
  // Token exchange with Google failed
  token_exchange: "Failed to complete sign-in with Google. Please try again.",
  token_exchange_failed: "Failed to complete sign-in with Google. Please try again.",
  // Could not fetch Google profile
  userinfo_failed: "Could not retrieve your Google profile. Please try again.",
  missing_email: "Your Google account did not provide an email address.",
  // Database error
  db_error: "A database error occurred during sign-in. Please try again.",
  // Session creation failed
  session_error: "Could not create your session. Please try again.",
  // Generic fallbacks kept for backwards compatibility
  callback_failed: "Sign-in callback failed. Please try again.",
  server_error: "An unexpected error occurred during sign-in. Please try again.",
  default: "Something went wrong during sign-in. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorKey = params.error;
  const returnTo = params.return_to;

  const errorMessage = errorKey
    ? ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.default
    : null;

  // Build the Google auth URL, passing return_to through if present
  const googleAuthUrl = returnTo
    ? `/api/auth/google?return_to=${encodeURIComponent(returnTo)}`
    : "/api/auth/google";

  return (
    <div className="atmosphere min-h-screen bg-bg text-ink">
      {/* ─── Sticky topbar ───────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 grid items-center px-6 py-3.5 backdrop-blur-md"
        style={{
          gridTemplateColumns: "auto 1fr auto",
          minHeight: 64,
          borderBottom: "1px solid var(--teal)",
          background: "rgba(10,16,24,0.92)",
        }}
      >
        <Link href="/" className="block">
          <Image
            src="/omg-logo-light.webp"
            alt="OMG / BRIDGE"
            width={140}
            height={28}
            priority
            className="h-7 w-auto block"
          />
        </Link>
        <div
          className="hidden md:block text-center text-ink-3"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span className="text-teal">·</span> SECURE · OAUTH 2.0 · READ-ONLY
        </div>
        <div
          className="flex gap-4 text-ink-3"
          style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase" }}
        >
          <a
            href="mailto:hello@wododigital.com"
            className="text-ink-2 no-underline transition-colors hover:text-vermilion"
          >
            NEED HELP?
          </a>
        </div>
      </header>

      {/* ─── Login screen ────────────────────────────────── */}
      <main className="relative z-10" style={{ paddingTop: 65 }}>
        <section
          className="grid place-items-center px-6 py-16"
          style={{ minHeight: "calc(100vh - 65px)" }}
        >
          <div
            className="relative w-full bg-surface-1"
            style={{
              maxWidth: 480,
              padding: "48px 44px",
              border: "1px solid var(--rule-strong)",
              boxShadow:
                "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 80px rgba(0,181,181,0.06)",
            }}
          >
            {/* Vermilion shadow block tucked top-right */}
            <div
              aria-hidden
              className="absolute bg-vermilion"
              style={{
                top: -10,
                right: -10,
                width: 80,
                height: 80,
                zIndex: -1,
              }}
            />

            {/* Eyebrow */}
            <div
              className="flex gap-3.5 text-ink-3 mb-6"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              <span>WELCOME · SIGN IN</span>
            </div>

            {/* Headline */}
            <h1
              className="font-display"
              style={{
                fontWeight: 700,
                fontSize: 38,
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Talk to your<br />
              data <span className="text-teal">in seconds.</span>
            </h1>

            <p
              className="text-ink-2"
              style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 36 }}
            >
              Sign in with the Google account that owns your Analytics or Search
              Console properties. We&apos;ll never post or modify anything.
            </p>

            {/* Error message */}
            {errorMessage && (
              <div
                className="mb-6 px-4 py-3 text-vermilion"
                style={{
                  background: "rgba(255,107,74,0.08)",
                  border: "1px solid rgba(255,107,74,0.4)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Google sign-in CTA */}
            <a
              href={googleAuthUrl}
              className="flex w-full items-center justify-center gap-3 transition-all"
              style={{
                padding: "16px 22px",
                background: "var(--ink)",
                color: "var(--bg)",
                border: "none",
                fontFamily: "var(--body)",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              <span
                className="inline-flex items-center justify-center"
                style={{ width: 22, height: 22 }}
              >
                <GoogleIcon />
              </span>
              <span>Continue with Google</span>
            </a>

            {/* Footer */}
            <div
              className="mt-8 pt-5 flex justify-between gap-3 flex-wrap text-ink-3"
              style={{
                borderTop: "1px solid var(--rule)",
                fontSize: 11,
                letterSpacing: "0.04em",
              }}
            >
              <span>
                By continuing you agree to our{" "}
                <Link href="/terms" className="text-teal hover:text-vermilion no-underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-teal hover:text-vermilion no-underline">
                  Privacy
                </Link>
                .
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.55c2.08-1.92 3.28-4.74 3.28-8.26z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.76c-.98.66-2.24 1.05-3.73 1.05-2.87 0-5.3-1.94-6.16-4.55H2.17v2.85A11 11 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.08A6.6 6.6 0 0 1 5.5 12c0-.72.13-1.42.34-2.08V7.07H2.17A11 11 0 0 0 1 12c0 1.78.43 3.46 1.17 4.93l3.67-2.85z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.17 7.07l3.67 2.85C6.7 7.31 9.13 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}
