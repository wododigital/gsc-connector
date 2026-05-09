-- Backfill: any user that already has a connected GSC property, GA4 property,
-- API key, or Google credential is treated as onboarded so they don't get
-- force-routed through the new wizard on next login.
UPDATE "users"
SET "onboarding_completed" = true
WHERE "onboarding_completed" = false
  AND (
    EXISTS (SELECT 1 FROM "gsc_properties" WHERE "gsc_properties"."user_id" = "users"."id")
    OR EXISTS (SELECT 1 FROM "ga4_properties" WHERE "ga4_properties"."user_id" = "users"."id")
    OR EXISTS (SELECT 1 FROM "api_keys" WHERE "api_keys"."user_id" = "users"."id")
    OR EXISTS (SELECT 1 FROM "google_credentials" WHERE "google_credentials"."user_id" = "users"."id")
  );
