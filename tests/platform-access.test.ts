/**
 * Platform entitlement + admin alert dispatcher tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDb } from "./setup";
import {
  hasPlatformAccess,
  getPlatformAccessMap,
  isGatedPlatform,
} from "@/lib/platform-access";
import { sendAdminAlert } from "@/lib/admin-alert";

// mockDb from setup.ts lacks platformAccess (added after setup was written)
// @ts-expect-error - augmenting the mock at runtime
mockDb.platformAccess = mockDb.platformAccess ?? {
  findUnique: vi.fn().mockResolvedValue(null),
  findMany: vi.fn().mockResolvedValue([]),
  upsert: vi.fn().mockResolvedValue({}),
};

describe("platform access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isGatedPlatform accepts only known platforms", () => {
    expect(isGatedPlatform("gtm")).toBe(true);
    expect(isGatedPlatform("google_ads")).toBe(true);
    expect(isGatedPlatform("facebook")).toBe(false);
    expect(isGatedPlatform("")).toBe(false);
  });

  it("hasPlatformAccess is false when no row exists (fail closed)", async () => {
    // @ts-expect-error runtime mock
    mockDb.platformAccess.findUnique.mockResolvedValueOnce(null);
    expect(await hasPlatformAccess("user-1", "gtm")).toBe(false);
  });

  it("hasPlatformAccess is false when the row is disabled", async () => {
    // @ts-expect-error runtime mock
    mockDb.platformAccess.findUnique.mockResolvedValueOnce({ enabled: false });
    expect(await hasPlatformAccess("user-1", "google_ads")).toBe(false);
  });

  it("hasPlatformAccess is true only for an enabled row", async () => {
    // @ts-expect-error runtime mock
    mockDb.platformAccess.findUnique.mockResolvedValueOnce({ enabled: true });
    expect(await hasPlatformAccess("user-1", "gtm")).toBe(true);
  });

  it("getPlatformAccessMap defaults every platform to false", async () => {
    // @ts-expect-error runtime mock
    mockDb.platformAccess.findMany.mockResolvedValueOnce([
      { platform: "gtm", enabled: true },
    ]);
    const map = await getPlatformAccessMap("user-1");
    expect(map).toEqual({ google_ads: false, gtm: true });
  });
});

describe("admin alert dedupe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const alert = {
    type: "credential_refresh_failed",
    severity: "error" as const,
    title: "t",
    message: "m",
    dedupeKey: "cred-1",
  };

  it("creates a notification row when no recent duplicate exists", async () => {
    mockDb.adminNotification.findFirst.mockResolvedValueOnce(null);
    await sendAdminAlert(alert);
    expect(mockDb.adminNotification.create).toHaveBeenCalledTimes(1);
    const args = mockDb.adminNotification.create.mock.calls[0][0];
    expect(args.data.metadata.dedupeKey).toBe("cred-1");
  });

  it("suppresses duplicates inside the dedupe window", async () => {
    mockDb.adminNotification.findFirst.mockResolvedValueOnce({ id: "existing" });
    await sendAdminAlert(alert);
    expect(mockDb.adminNotification.create).not.toHaveBeenCalled();
  });

  it("never throws even when the DB write fails", async () => {
    mockDb.adminNotification.findFirst.mockRejectedValueOnce(new Error("db down"));
    await expect(sendAdminAlert(alert)).resolves.toBeUndefined();
  });
});
