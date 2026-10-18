# Private YouTube analytics: deployment and acceptance

This is a deployable Worker/D1 service in `services/youtube-analytics`, not a live private backend yet. Public channel and video collection continues independently on GitHub Pages. No private analytics or OAuth credentials belong in `assets/`, Git history, Pages artifacts, or the public password gate.

## What is implemented

- Single-use, 24-hour invitation; token is hashed in storage and carried in a URL fragment, not a query string. Ten-minute OAuth states are hashed, browser-cookie bound and consumed atomically. PKCE S256, exact callback URI, HTTPS-only HttpOnly SameSite cookies.
- Google scopes: `youtube.readonly` and `yt-analytics.readonly` only. Expected channel is pinned to `UCyLnzmIiCEvTpw8V7bWdj5g`. Both Data API channel ownership and an Analytics query must succeed before saving the connection. A YouTube Studio Viewer invitation does not substitute for channel-owner OAuth authorization.
- Refresh credentials use AES-256-GCM with an independently provisioned secret. Private routes validate Cloudflare Access JWT signatures, issuer, audience, expiry and an administrator email allowlist. A spoofed email header alone is not accepted. All responses are no-store; no CORS access is granted to the public website.
- Read-only private uploads inventory, with titles/metadata kept exclusively in D1; yearly daily-performance backfill, first 7/28/90-day windows, lifetime audience/traffic/device/subscription/retention queries, resumable pagination, bounded batches, retries, status/coverage tracking.
- Reporting API discovery chooses current basic, traffic source, device/OS, demographics and reach report types. Existing report jobs are reused. New jobs produce future daily reports and approximately 30 days of historical reports when available. CSV ingestion streams into resumable 250-row pages. Corrected reports retain provenance; `newestBulkVersions` selects the latest version for analysis.
- Recurring 35-day refresh sweep, metadata expiry, per-run channel revalidation, background scheduling, and disconnect/revoke/data-erasure workflow. Losing authorization triggers cleanup; inaccessible authorization is not assumed valid forever.
- Private CSV exports (1,000 rows/page with X-Next-Offset), coverage JSON, bulk report metadata/pages, and hypothesis/cohort/outcome/date-window analysis plans. Weighted watch-duration helper and comparison checks distinguish observational cohorts from causal experiments.

## Hosting/account setup still needed

The owner previously stated they have no Cloudflare account. No Cloudflare account, billing, database, Access policy, DNS route, OAuth client or Troy authorization was created during implementation. Do not ask Troy to authorize until the acceptance checks below pass.

1. Create a Cloudflare account and add the domain or an appropriate DNS delegation. Review/accept provider terms yourself. Keep existing GitHub Pages DNS working. Do not migrate unrelated DNS blindly.
2. Run `npm ci` in `services/youtube-analytics`, then `npx wrangler login`. Create D1 with `npx wrangler d1 create fmw-youtube-analytics`. Put its actual ID into `wrangler.jsonc`.
3. Create the backend custom domain `analytics.freemarketwildlife.com` in Workers. Configure its route/custom domain; `workers_dev` and preview URLs deliberately stay disabled.
4. Configure Cloudflare Access for `/admin`, `/admin.js`, and `/api/*`, with only approved administrator emails. Leave `/connect`, `/connect.js`, `/oauth/start`, `/oauth/callback`, `/privacy` and `/health` reachable for invitation-based OAuth. The service still cryptographically checks JWTs itself. Copy the exact Access application audience and team issuer into `ACCESS_AUD` and `ACCESS_ISSUER`. Set `ADMIN_EMAILS` explicitly; Troy does not need admin access just to authorize his channel.
5. In Google Cloud project `voltaic-sensor-512006-f6`, enable YouTube Analytics API and YouTube Reporting API in addition to the existing Data API. Configure Google Auth Platform branding, support/contact email, authorized domain, public privacy URL and the two read-only scopes. Use an External app for Troy's external account. Create a Web application OAuth client with exact callback `https://analytics.freemarketwildlife.com/oauth/callback`. Put the client ID in vars; save the secret with `npx wrangler secret put GOOGLE_CLIENT_SECRET`.
6. Generate an encryption key with `openssl rand -base64 32`, retain it in the owner's password manager, and enter it with `npx wrangler secret put TOKEN_ENCRYPTION_KEY`. Never write the key into source or chat. Replacing it without a migration makes saved credentials unreadable. Configure `GOOGLE_CLIENT_ID` in vars.
7. Run `npm run db:remote`, then `npm run deploy`. Cloudflare Access and Google OAuth need matching real hostnames first. Do not enable a broad public route to private data.
8. Test with an owner-controlled test channel in an isolated test deployment/DB. Use a separate expected-channel ID for that deployment. Do not weaken the production channel pin to get a test connection through. Then restore the production pin for Troy.
9. Publish Google OAuth appropriately. In external Testing mode, non-basic scopes commonly make refresh tokens expire after seven days. Add test users only for staging. Google may require sensitive-scope verification, domain proof, a privacy policy and a demonstration before production use. Do not bypass an unverified-app warning on Troy's behalf. The scopes shown to Troy must match the two documented read-only scopes.
10. Only after a real round trip, private Access protection, background refresh and deletion tests pass, set `assets/data/analytics-connection.json` serviceOrigin to `https://analytics.freemarketwildlife.com`. This enables the administrator link in the public connection information page. It does not embed a secret or invite. Generate Troy's invitation from private `/admin`, and send it manually after approval.

## Acceptance checks before inviting Troy

- Health ready; unauthenticated /api/videos, /api/coverage, /api/export, /api/bulk and /admin denied. A forged JWT or unauthorized email denied. Cross-origin mutations denied.
- Invitation expires and cannot be reused; callback state mismatch/replay denied. Wrong Google channel rejected and issued refresh grant revoked. Declining a scope cannot create a connected state.
- Real staged OAuth callback succeeds; refresh works after the initial access token expires; no secrets appear in source, URLs, logs, Pages data or screenshots.
- Inventory pagination finishes; public/private/unlisted videos are labelled, missing/deleted videos are not falsely promised. Historical jobs advance and restart without duplicate rows. Coverage reports missing/suppressed data as such.
- Real Analytics and Reporting endpoints accept each requested report; empty, unsupported, processing-delayed and error responses remain distinct. Adjust only report combinations documented by Google; record unavailable cases rather than filling zeros.
- Bulk list pagination, resumable downloads, corrected-report precedence, stale/expired-report handling and data latency confirmed with actual Google reports.
- Access revocation stops imports and erases data, including bulk pages, metadata and queued reports. Inspect provider backup retention and ensure it meets the deletion requirement; no permanent private-data backups in Git.
- Measure CPU time, D1 reads/writes/storage, Google quotas, backlog size and end-to-end freshness on the real channel. The conservative free-tier limits may need a larger paid budget or different storage for the full lifetime dataset. No paid capacity has been enabled.

## Important coverage and operational limits

YouTube Reporting is not an unlimited lifetime backfill: a new job normally offers the prior 30 days plus future data. Analytics queries fill supported older history; reach CTR may therefore need Troy's Studio historical exports for dates before bulk availability. Privacy thresholds suppress audience slices. API reports can lag several days; the recent query windows intentionally end three days behind today. Re-fetch recent windows to capture revisions.

The private API can enumerate accessible private/unlisted videos after consent. Deleted uploads cannot be recovered, and some historical data remains aggregated or unavailable. A finished empty query means empty-or-suppressed, never proof of zero viewers. Demographics show audience segments, not identified people. Format labels must come from YouTube's supported creatorContentType reports or authored annotations; duration alone does not prove Shorts.

The initial queue is deliberately bounded for free-tier evaluation. Its historical backfill can take a long time for thousands of videos, and the recent sweep must not be called real-time until measured. Bulk imports are the efficient ongoing path; private coverage endpoints expose outstanding/failed work. Capacity must be sized after the staged and real-channel measurements. More metrics must not silently increase quotas or paid usage.

Queries for yearly, first-7/28/90-day, lifetime and recent windows overlap. Exports retain report/date/window provenance: never add overlapping windows together. Use the same publication-age window, format and duration cohort when comparing videos. Retention percentages require weighted totals; country/demographic aggregates should not be summed across different reports. Content associations are hypotheses, not causal proof.
