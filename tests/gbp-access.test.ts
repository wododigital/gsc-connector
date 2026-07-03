/**
 * GBP credential selection tests
 *
 * Regression tests for the "GMB keeps disconnecting" bug: the helper used to
 * pick the most-recently-updated credential with no scope check, so a GSC
 * refresh (which bumps updatedAt) could promote a credential whose refresh
 * token lacks business.manage. It also used updateMany({ userId }), spraying
 * one credential's access token across all credential rows.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mockDb } from "./setup";
import { getGbpAccessToken } from "@/lib/gbp/access";
import { encrypt } from "@/lib/encryption";

const FUTURE = new Date(Date.now() + 60 * 60 * 1000);
const PAST = new Date(Date.now() - 60 * 1000);

const GBP_SCOPES =
  "openid email profile https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/business.manage";
const NO_GBP_SCOPES =
  "openid email profile https://www.googleapis.com/auth/webmasters.readonly";

function cred(id: string, scopes: string, accessToken: string, expiry: Date) {
  return {
    id,
    accessTokenEncrypted: encrypt(accessToken),
    refreshTokenEncrypted: encrypt(`refresh-${id}`),
    tokenExpiry: expiry,
    scopes,
  };
}

describe("getGbpAccessToken credential selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers the credential with business.manage scope over a more recent one without it", async () => {
    // findMany is ordered by updatedAt desc: the scope-less credential is
    // first (most recently updated), the GBP-scoped one second.
    mockDb.googleCredential.findMany.mockResolvedValueOnce([
      cred("cred-recent-no-gbp", NO_GBP_SCOPES, "token-without-gbp", FUTURE),
      cred("cred-older-with-gbp", GBP_SCOPES, "token-with-gbp", FUTURE),
    ]);

    const token = await getGbpAccessToken("user-1");
    expect(token).toBe("token-with-gbp");
  });

  it("falls back to the most recent credential when none records the GBP scope (legacy rows)", async () => {
    mockDb.googleCredential.findMany.mockResolvedValueOnce([
      cred("cred-legacy", "", "legacy-token", FUTURE),
    ]);

    const token = await getGbpAccessToken("user-1");
    expect(token).toBe("legacy-token");
  });

  it("throws NO_CREDENTIAL when the user has no credentials", async () => {
    mockDb.googleCredential.findMany.mockResolvedValueOnce([]);
    await expect(getGbpAccessToken("user-1")).rejects.toMatchObject({
      code: "NO_CREDENTIAL",
    });
  });

  it("refreshes an expired token and persists it to ONLY the selected credential row", async () => {
    mockDb.googleCredential.findMany.mockResolvedValueOnce([
      cred("cred-recent-no-gbp", NO_GBP_SCOPES, "stale-a", FUTURE),
      cred("cred-with-gbp", GBP_SCOPES, "stale-b", PAST),
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "fresh-gbp-token", expires_in: 3600 }),
      })
    );

    const token = await getGbpAccessToken("user-1");
    expect(token).toBe("fresh-gbp-token");

    // Must be a targeted update on the refreshed row, never updateMany
    expect(mockDb.googleCredential.updateMany).not.toHaveBeenCalled();
    expect(mockDb.googleCredential.update).toHaveBeenCalledTimes(1);
    const updateArgs = mockDb.googleCredential.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "cred-with-gbp" });
  });
});
