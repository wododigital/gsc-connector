import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in - GSC Connect",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; return_to?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Access was denied. Please try again.",
  no_code: "Authentication failed - no code received from Google. Please try again.",
  token_exchange: "Failed to exchange token with Google. Please try again.",
  callback_failed: "Sign-in callback failed. Please try again.",
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-2xl font-bold text-green-400">GSC Connect</span>
          </a>
          <p className="mt-2 text-zinc-400 text-sm">
            Connect Google Search Console to your AI tools
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h1 className="text-xl font-semibold text-zinc-100 mb-2 text-center">
            Sign in to your account
          </h1>
          <p className="text-zinc-400 text-sm text-center mb-6">
            Use your Google account that has access to Google Search Console.
          </p>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Sign in button */}
          <a
            href={googleAuthUrl}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm transition-colors"
          >
            <GoogleIcon />
            Sign in with Google
          </a>

          <p className="mt-6 text-center text-xs text-zinc-500 leading-relaxed">
            By signing in, you agree to grant GSC Connect read access to your
            Google Search Console data. Your tokens are encrypted and stored
            securely.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z"
        fill="#4285F4"
      />
      <path
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
        fill="#EA4335"
      />
    </svg>
  );
}
