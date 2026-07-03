/**
 * Admin alert dispatcher
 *
 * Single entry point for "the admin must know about this" events:
 * 1. Persists an AdminNotification row (shows in /admin/notifications).
 * 2. Sends an email via the Gmail API to ADMIN_ALERT_EMAIL.
 *
 * Deduplication: if a notification with the same type + dedupeKey was
 * created within the last ALERT_DEDUPE_MINUTES, neither a row nor an email
 * is produced. This keeps a flapping credential or an error burst from
 * paging the admin dozens of times.
 *
 * Email transport is Gmail API over OAuth (house policy - never SMTP),
 * using a DEDICATED OAuth client (gmail.send is a restricted scope and must
 * not be added to the app's verified Google client):
 *   GMAIL_ALERT_CLIENT_ID / GMAIL_ALERT_CLIENT_SECRET / GMAIL_ALERT_REFRESH_TOKEN
 *   GMAIL_ALERT_SENDER   - the mailbox that granted consent
 *   ADMIN_ALERT_EMAIL    - recipient (defaults to the sender)
 *
 * If the env vars are absent (local dev), alerts still land in the DB and
 * the email step is skipped with a console warning. Alerting must never
 * throw into a caller's request path.
 */

import db from "./db.js";

const ALERT_DEDUPE_MINUTES = 60;

export type AlertSeverity = "info" | "warning" | "error";

export interface AdminAlertInput {
  /** Machine type, e.g. "credential_refresh_failed", "mcp_error_spike" */
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  /**
   * Stable key identifying the underlying incident (e.g. the credential id).
   * Alerts with the same type+dedupeKey are suppressed for the dedupe window.
   */
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

// ----------------------------------------------------------------
// Gmail API sending
// ----------------------------------------------------------------

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getGmailAccessToken(): Promise<string | null> {
  const clientId = process.env.GMAIL_ALERT_CLIENT_ID;
  const clientSecret = process.env.GMAIL_ALERT_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_ALERT_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    console.error("[admin-alert] Gmail token refresh failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

function buildRawEmail(from: string, to: string, subject: string, body: string): string {
  const message = [
    `From: OMG Bridge Alerts <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

async function sendAlertEmail(subject: string, body: string): Promise<boolean> {
  const sender = process.env.GMAIL_ALERT_SENDER;
  const recipient = process.env.ADMIN_ALERT_EMAIL ?? sender;
  if (!sender || !recipient) {
    console.warn("[admin-alert] GMAIL_ALERT_SENDER/ADMIN_ALERT_EMAIL not set - skipping email");
    return false;
  }

  const accessToken = await getGmailAccessToken();
  if (!accessToken) {
    console.warn("[admin-alert] Gmail credentials not configured - alert email skipped");
    return false;
  }

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: buildRawEmail(sender, recipient, subject, body) }),
    }
  );

  if (!res.ok) {
    console.error("[admin-alert] Gmail send failed:", res.status, await res.text());
    return false;
  }
  return true;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Fire an admin alert (DB notification + email), deduplicated.
 * Never throws - alerting failures must not break the calling request.
 */
export async function sendAdminAlert(input: AdminAlertInput): Promise<void> {
  try {
    const since = new Date(Date.now() - ALERT_DEDUPE_MINUTES * 60 * 1000);
    const recent = await db.adminNotification.findFirst({
      where: {
        type: input.type,
        createdAt: { gte: since },
        metadata: { path: ["dedupeKey"], equals: input.dedupeKey },
      },
      select: { id: true },
    });
    if (recent) return;

    await db.adminNotification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        severity: input.severity,
        metadata: { ...(input.metadata ?? {}), dedupeKey: input.dedupeKey },
      },
    });

    const appUrl = process.env.APP_URL ?? "https://bridge.theomg.ai";
    const emailBody = [
      input.message,
      "",
      `Severity: ${input.severity}`,
      `Time: ${new Date().toISOString()}`,
      input.metadata ? `Details: ${JSON.stringify(input.metadata, null, 2)}` : "",
      "",
      `Admin panel: ${appUrl}/admin/notifications`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendAlertEmail(`[OMG Bridge] ${input.title}`, emailBody);
  } catch (err) {
    console.error("[admin-alert] Failed to dispatch alert:", err);
  }
}
