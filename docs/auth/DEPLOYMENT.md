# Workspace Google sign-in

Implementation: `services/workspace-auth`. Separate from the private YouTube Analytics service. Owner: `freemarketwildlife@gmail.com`. Only basic `openid email` identity scopes; no Drive or YouTube permission.

## Current state

Implemented and tested locally, not activated. Cloudflare CLI authorization is complete and remote D1 database `fmw-workspaces` has its initial schema applied. The Google web client is configured, and its secret is stored in Cloudflare. The protected hosting switch and real Google round-trip verification are still pending. Domain DNS remains at the registrar; no Cloudflare zone existed when checked. The GitHub Pages preview continues its existing access mode. Its `workspace-auth.json` is disabled. Only the Worker asset pack enables the new account UI; do not enable it in public Pages manually. No existing notes or browser storage are changed.

## Activate

1. From `services/workspace-auth`, run `npm exec wrangler login` and authorize the newly created Cloudflare account in the browser. Do not paste passwords or tokens into chat.
2. Run `npm exec wrangler d1 create fmw-workspaces`; insert the returned database ID into `wrangler.jsonc`. Apply `npm run db:remote`.
3. In Google Cloud → Google Auth Platform, create a **Web application** OAuth client for Free Market Wildlife. Use External audience for clients outside your organization. Configure branding/support and the necessary domain verification. Request only `openid` and `email`. During testing, add the owner and designated test users as required by the console. Register the exact callback `https://freemarketwildlife.com/auth/callback`. Save the public client ID to `GOOGLE_CLIENT_ID` in `wrangler.jsonc`. Save the client secret via `npm exec wrangler secret put GOOGLE_CLIENT_SECRET` at its hidden prompt. Never put that secret in the repository, chat, Pages, or screenshots. Complete any consent-screen requirements Google presents before production.
4. Connect the website domain to Cloudflare deliberately, preserving existing DNS/email records. Plan the same-origin hosting switch: all website requests must reach this Worker. Configure its custom domain or an appropriate Worker route. Do not merely put a proxy in front of publicly accessible private data.
5. Package with `npm run check`, then deploy using `npm run deploy` after configuration is complete. The Worker uses `run_worker_first: true`, disables workers.dev and preview URLs, rejects unexpected hosts, and checks every workspace route and alias before serving assets. Configure platform rate limits for sign-in endpoints as appropriate to the account.
6. Before announcing protection, remove workspace pages and future private data from the old GitHub Pages artifact and deploy that removal; disable/remove the old Pages deployment or make it public-pages-only. Test the repository's github.io URL, custom-domain aliases, direct index.html paths, percent-encoded paths, and previews. Current public repository templates and past public data remain public: never commit notes, memberships, secrets or deliveries. The new membership database is private D1.
7. Move the existing scheduled public YouTube collector/deploy pipeline to publish its refreshed assets to the Worker as part of cutover. A one-time Worker upload does not preserve the current daily metrics updates automatically. Keep collector success distinct from deployment success.
8. Complete a real Google round trip as the owner. The owner is bound to its Google subject on first verified login. Visit Manage access; grant an approved test account one workspace, then confirm its chooser and direct-link restrictions. Test an unassigned account goes directly to `/build-a-business/`; revoke a current member and confirm denial on the next request. Test logout, switch account and expired sessions. Only then treat step 1 as live.

## Access behavior

The owner can access all three workspaces and manage grants at `/account/`. Each grant pairs an email with a workspace. On the first verified Google login it binds to the stable Google subject; subsequently another subject with the same email cannot inherit that grant. Only Gmail or a Google Workspace identity with an authoritative email claim is supported in this first version. Other Google accounts with third-party email need an additional verification flow before support.

The hidden chooser is populated from `/api/account` after login. No-access accounts return to Build a Business. Cookies are Secure/HttpOnly/SameSite=Lax, sessions expire after 24 hours, and membership is read again on every request. Grant/revoke and logout require same-origin POST/DELETE. Sign-in state is browser-bound, single-use, expires in 10 minutes, and uses PKCE and nonce. Google tokens are signature/issuer/audience/expiry checked with jose; no Google refresh/access tokens are retained.

## Existing entries

Step 1 does not read, move or delete localStorage. Keep the website origin unchanged during cutover, including HTTPS and hostname, so existing browser-local entries remain accessible to the same browser. Export backups before any production switch. Account storage and repeat-safe migration are step 2; server login does not make local notes shared. Never upload Philip's personal notes into a client workspace implicitly.

## Validation

`npm test` covers direct routes and aliases, missing configuration, anonymous access, owner-only grants/revokes, CSRF, logout, signed Google callback using test keys, state replay, email authority/nonce, membership subject binding and no-access redirect. `npm run check` packages the complete existing site and runs Wrangler dry-run. A test signing key is generated in memory; it is never accepted by production. Real Google/Cloudflare activation must still be verified with real accounts.

Official references: https://developers.google.com/identity/openid-connect/openid-connect and https://developers.cloudflare.com/workers/static-assets/binding/.
