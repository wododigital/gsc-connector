"use client";

import { useState } from "react";

interface SettingsClientProps {
  email: string;
  displayName: string;
  initials: string;
}

type ToastTone = "info" | "success";

interface Toast {
  message: string;
  tone: ToastTone;
}

export function SettingsClient({ email, displayName, initials }: SettingsClientProps) {
  // Profile
  const [name, setName] = useState(displayName);

  // Workspace
  const [workspace, setWorkspace] = useState("WODO Digital");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState("DD MMM YYYY");

  // Notifications
  const [emailDigest, setEmailDigest] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  // securityAlerts is always-on; rendered as disabled checkbox.

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);

  const flash = (message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2400);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No save endpoint exists yet; placeholder only.
    // eslint-disable-next-line no-console
    console.log("[settings] profile save (placeholder)", { name });
    flash("Saved (placeholder). No backend endpoint yet.", "success");
  };

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log("[settings] workspace save (placeholder)", {
      workspace,
      timezone,
      dateFormat,
    });
    flash("Saved (placeholder). No backend endpoint yet.", "success");
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log("[settings] notifications save (placeholder)", {
      emailDigest,
      productUpdates,
      securityAlerts: true,
    });
    flash("Saved (placeholder). No backend endpoint yet.", "success");
  };

  const handleDisconnect = () => {
    // eslint-disable-next-line no-console
    console.log("[settings] disconnect google (placeholder)");
    flash("Disconnect not yet wired. Use SIGN OUT from the topbar.", "info");
  };

  const handleDelete = () => {
    // eslint-disable-next-line no-console
    console.log("[settings] delete account (placeholder)");
    flash("Delete account not yet wired. Contact support.", "info");
  };

  const handleSignOutOthers = () => {
    // eslint-disable-next-line no-console
    console.log("[settings] sign out other sessions (placeholder)");
    flash("Other sessions revoked (placeholder).", "success");
  };

  return (
    <>
      <style>{SETTINGS_CSS}</style>

      {/* Profile */}
      <section className="settings-card">
        <header className="settings-card-head">
          <h2>Profile</h2>
          <span className="settings-card-meta">YOUR ACCOUNT</span>
        </header>
        <form className="settings-card-body" onSubmit={handleProfileSubmit}>
          <div className="settings-row">
            <div className="settings-avatar" aria-hidden="true">{initials}</div>
            <div className="settings-avatar-meta">
              <div className="settings-avatar-label">AVATAR</div>
              <div className="settings-avatar-hint">
                Initials are generated from your email. Custom avatars coming soon.
              </div>
            </div>
          </div>

          <div className="settings-field">
            <label className="input-label" htmlFor="settings-name">DISPLAY NAME</label>
            <input
              id="settings-name"
              className="input-field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="settings-field">
            <label className="input-label" htmlFor="settings-email">EMAIL</label>
            <input
              id="settings-email"
              className="input-field"
              type="email"
              value={email}
              readOnly
              aria-readonly="true"
            />
            <div className="settings-hint">Managed by Google. Sign in with a different account to change it.</div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary">Save profile</button>
          </div>
        </form>
      </section>

      {/* Workspace */}
      <section className="settings-card">
        <header className="settings-card-head">
          <h2>Workspace</h2>
          <span className="settings-card-meta">DEFAULTS</span>
        </header>
        <form className="settings-card-body" onSubmit={handleWorkspaceSubmit}>
          <div className="settings-field">
            <label className="input-label" htmlFor="settings-workspace">WORKSPACE NAME</label>
            <input
              id="settings-workspace"
              className="input-field"
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="WODO Digital"
            />
          </div>

          <div className="settings-grid-2">
            <div className="settings-field">
              <label className="input-label" htmlFor="settings-timezone">TIMEZONE</label>
              <select
                id="settings-timezone"
                className="input-field"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                <option value="America/New_York">America/New_York (ET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Australia/Sydney">Australia/Sydney (AET)</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="input-label" htmlFor="settings-dateformat">DATE FORMAT</label>
              <select
                id="settings-dateformat"
                className="input-field"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <option value="DD MMM YYYY">DD MMM YYYY (10 May 2026)</option>
                <option value="MMM DD, YYYY">MMM DD, YYYY (May 10, 2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-05-10)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (10/05/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (05/10/2026)</option>
              </select>
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary">Save workspace</button>
          </div>
        </form>
      </section>

      {/* Notifications */}
      <section className="settings-card">
        <header className="settings-card-head">
          <h2>Notifications</h2>
          <span className="settings-card-meta">EMAIL PREFERENCES</span>
        </header>
        <form className="settings-card-body" onSubmit={handleNotificationsSubmit}>
          <label className="settings-check">
            <input
              type="checkbox"
              checked={emailDigest}
              onChange={(e) => setEmailDigest(e.target.checked)}
            />
            <span>
              <strong>Weekly email digest</strong>
              <em>Summary of queries, top tools, and any errors from the past 7 days.</em>
            </span>
          </label>

          <label className="settings-check">
            <input
              type="checkbox"
              checked={productUpdates}
              onChange={(e) => setProductUpdates(e.target.checked)}
            />
            <span>
              <strong>Product updates</strong>
              <em>New tools, integrations, and changelog highlights. Roughly once a month.</em>
            </span>
          </label>

          <label className="settings-check is-locked">
            <input type="checkbox" checked readOnly disabled />
            <span>
              <strong>Security alerts</strong>
              <em>Always on. Sign-in events, key rotations, and Google scope changes.</em>
            </span>
          </label>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary">Save notifications</button>
          </div>
        </form>
      </section>

      {/* Security */}
      <section className="settings-card">
        <header className="settings-card-head">
          <h2>Security</h2>
          <span className="settings-card-meta">CONNECTED ACCOUNT</span>
        </header>
        <div className="settings-card-body">
          <div className="settings-field">
            <div className="input-label">GOOGLE ACCOUNT</div>
            <div className="settings-readonly">{email}</div>
            <div className="settings-hint">Used for sign in and Google API access (GSC, GA4).</div>
          </div>

          <div className="settings-danger-row">
            <button type="button" className="settings-link-danger" onClick={handleDisconnect}>
              Disconnect Google
            </button>
            <button type="button" className="settings-link-danger" onClick={handleDelete}>
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className="settings-card">
        <header className="settings-card-head">
          <h2>Sessions</h2>
          <span className="settings-card-meta">ACTIVE DEVICES</span>
        </header>
        <div className="settings-card-body">
          <div className="settings-session">
            <div>
              <div className="settings-session-title">
                Current session <span className="pill info">THIS DEVICE</span>
              </div>
              <div className="settings-session-meta">
                Browser session · signed in via Google · 7-day cookie
              </div>
            </div>
            <div className="settings-session-meta mono">just now</div>
          </div>

          <div className="settings-actions">
            <button type="button" className="btn" onClick={handleSignOutOthers}>
              Sign out all other sessions
            </button>
          </div>
        </div>
      </section>

      {toast && (
        <div role="status" className={`settings-toast ${toast.tone}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}

const SETTINGS_CSS = `
.settings-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  margin-bottom: 18px;
}
.settings-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--rule);
}
.settings-card-head h2 {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 0;
}
.settings-card-meta {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.settings-card-body {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.settings-field { display: flex; flex-direction: column; }
.settings-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.settings-hint {
  margin-top: 6px;
  font-size: 11px;
  color: var(--ink-3);
}
.settings-readonly {
  padding: 11px 13px;
  background: var(--bg);
  border: 1px dashed var(--rule);
  color: var(--ink-2);
  font-family: var(--body);
  font-size: 14px;
}
.settings-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.settings-avatar {
  width: 56px;
  height: 56px;
  background: var(--teal);
  color: var(--bg);
  display: grid;
  place-items: center;
  font-family: var(--display);
  font-weight: 700;
  font-size: 22px;
}
.settings-avatar-meta { display: flex; flex-direction: column; gap: 4px; }
.settings-avatar-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.settings-avatar-hint { font-size: 12px; color: var(--ink-2); }
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}
.settings-check {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 12px;
  align-items: start;
  cursor: pointer;
}
.settings-check input { margin-top: 3px; accent-color: var(--teal); }
.settings-check.is-locked { opacity: 0.7; cursor: not-allowed; }
.settings-check strong {
  display: block;
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
  margin-bottom: 2px;
}
.settings-check em {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: var(--ink-3);
}
.settings-danger-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding-top: 6px;
  border-top: 1px dashed var(--rule);
}
.settings-link-danger {
  background: none;
  border: none;
  padding: 0;
  color: var(--vermilion);
  font-family: var(--body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  cursor: pointer;
}
.settings-link-danger:hover { text-decoration: underline; }

.settings-session {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg);
  border: 1px solid var(--rule);
  gap: 14px;
}
.settings-session-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}
.settings-session-meta {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
}
.settings-session-meta.mono { font-family: var(--mono, monospace); }

.settings-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 80;
  padding: 12px 16px;
  background: var(--surface-1);
  border: 1px solid var(--teal);
  color: var(--ink);
  font-size: 12px;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.35);
}
.settings-toast.success { border-color: var(--teal); }
.settings-toast.info { border-color: var(--rule-strong); }

@media (max-width: 720px) {
  .settings-grid-2 { grid-template-columns: 1fr; }
  .settings-card-head { flex-direction: column; align-items: flex-start; gap: 4px; }
  .settings-actions { justify-content: stretch; }
  .settings-actions .btn { width: 100%; text-align: center; }
}
`;
