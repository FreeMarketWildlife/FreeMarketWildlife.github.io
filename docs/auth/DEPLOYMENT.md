# Workspace Google sign-in

Implementation: `services/workspace-auth`. Separate from the private YouTube Analytics service. Owner: `freemarketwildlife@gmail.com`. Only basic `openid email` identity scopes; no Drive or YouTube permission.

## Current state

Cloudflare is active on `dane.ns.cloudflare.com` and `gail.ns.cloudflare.com`; original DNS is saved in `dns-before-cutover.json`. No Namecheap email redirects were configured. Both canonical and www routes are deployed (www redirects to canonical HTTPS). The Google secret is stored in Cloudflare, never in source. Remote D1 is migrated.

A real Google sign-in by the owner succeeded on 2026-10-19. The owner chooser shows all three workspaces and Manage access opens. Anonymous workspace/alias/owner URLs redirect to sign-in. The GitHub Pages origin returns 404 for `/philip-aram/` after the successful public-only deployment (Actions run 39289334316). Cookie-free origin passthrough keeps the three existing public YouTube datasets fresh; all three reported successful collection after cutover. Worker assets alone enable the new sign-in UI.

Google is External / In production after publishing the factual privacy notice at `/privacy/` and registering its URL in Google Branding. The homepage links to it. Login requests only `openid email`; no sensitive or restricted service scopes are requested. Additional-account real-world authorization/no-access checks remain unverified; the automated suite covers these cases. The owner can assign client emails through Manage access. Existing browser notes are untouched; account syncing is not implemented in step 1.

## Activate

1. From `services/workspace-auth`, run `npm exec wrangler login` and authorize the newly created Cloudflare account in the browser. Do not paste passwords or tokens into chat.
2. Run `npm exec wrangler d1 create fmw-workspaces`; insert the returned database ID into `wrangler.jsonc`. Apply `npm run db:remote`.
3. In Google Cloud → Google Auth Platform, create a **Web application** OAuth client for Free Market Wildlife. Use External audience for clients outside your organization. Configure branding/support and the necessary domain verification. Request only `openid` and `email`. During testing, add the owner and designated test users as required by the console. Register the exact callback `https://freemarketwildlife.com/auth/callback`. Save the public client ID to `GOOGLE_CLIENT_ID` in `wrangler.jsonc`. Save the client secret via `npm exec wrangler secret put GOOGLE_CLIENT_SECRET` at its hidden prompt. Never put that secret in the repository, chat, Pages, or screenshots. Complete any consent-screen requirements Google presents before production.
4. Connect the website domain to Cloudflare deliberately, preserving existing DNS/email records. Plan the same-origin hosting switch: all website requests must reach this Worker. Configure its custom domain or an appropriate Worker route. Do not merely put a proxy in front of publicly accessible private data.
5. Package with `npm run check`, then deploy using `npm run deploy` after configuration is complete. The Worker uses `run_worker_first: true`, disables workers.dev and preview URLs, rejects unexpected hosts, and checks every workspace route and alias before serving assets. Configure platform rate limits for sign-in endpoints as appropriate to the account.
6. Before announcing protection, remove workspace pages and future private data from the old GitHub Pages artifact and deploy that removal; disable/remove the old Pages deployment or make it public-pages-only. Test the repository's github.io URL, custom-domain aliases, direct index.html paths, percent-encoded paths, and previews. Current public repository templates and past public data remain public: never commit notes, memberships, secrets or deliveries. The new membership database is private D1.
7. Keep the existing scheduled GitHub Pages collector publishing PUBLIC assets only. The Worker passes through an explicit allowlist of public channel, video and history JSON paths to the original Pages origin using same-zone route subrequests, stripping browser cookies. All other assets use the packaged Worker binding. Never add private data to this allowlist. Keep collector success distinct from deployment success.
8. Complete a real Google round trip as the owner. The owner is bound to its Google subject on first verified login. Visit Manage access; grant an approved test account one workspace, then confirm its chooser and direct-link restrictions. Test an unassigned account goes directly to `/build-a-business/`; revoke a current member and confirm denial on the next request. Test logout, switch account and expired sessions. Only then treat step 1 as live.

## Access behavior

The owner can access all three workspaces and manage grants at `/account/`. Each grant pairs an email with a workspace. On the first verified Google login it binds to the stable Google subject; subsequently another subject with the same email cannot inherit that grant. Only Gmail or a Google Workspace identity with an authoritative email claim is supported in this first version. Other Google accounts with third-party email need an additional verification flow before support.

The hidden chooser is populated from `/api/account` after login. No-access accounts return to Build a Business. Cookies are Secure/HttpOnly/SameSite=Lax, sessions expire after 24 hours, and membership is read again on every request. Grant/revoke and logout require same-origin POST/DELETE. Sign-in state is browser-bound, single-use, expires in 10 minutes, and uses PKCE and nonce. Google tokens are signature/issuer/audience/expiry checked with jose; no Google refresh/access tokens are retained.

## Existing entries

Step 1 does not read, move or delete localStorage. Keep the website origin unchanged during cutover, including HTTPS and hostname, so existing browser-local entries remain accessible to the same browser. Export backups before any production switch. Account storage and repeat-safe migration are step 2; server login does not make local notes shared. Never upload Philip's personal notes into a client workspace implicitly.

## Validation

`npm test` covers direct routes and aliases, missing configuration, anonymous access, owner-only grants/revokes, CSRF, logout, signed Google callback using test keys, state replay, email authority/nonce, membership subject binding and no-access redirect. `npm run check` packages the complete existing site and runs Wrangler dry-run. A test signing key is generated in memory; it is never accepted by production. Real Google/Cloudflare activation must still be verified with real accounts.

Official references: https://developers.google.com/identity/openid-connect/openid-connect and https://developers.cloudflare.com/workers/static-assets/binding/.

## Future source deployment

`npm run deploy --prefix services/workspace-auth` publishes application HTML, scripts, styles and backend changes to the protected Worker. GitHub push updates the public-only Pages origin and scheduled metrics; it does not redeploy the Worker. Keep both deployment responsibilities explicit.

## Primary workspace and account interface

Google sign-in now redirects directly to the client's first assigned, still-authorized workspace. Membership insertion order determines the primary workspace; adding or visiting another workspace does not change it. Revoking the primary falls back to the earliest remaining membership. The owner defaults to Philip Aram, followed by the other configured workspaces. Accounts without memberships continue to Build a Business.

Every protected workspace has a top-right account dropdown with authorized workspace links, the primary label, account switching, and sign-out. Account dialogs and access management use regular white Arial text like the workspaces. The public site's pixel typography remains intact.

Validation: `npm test --prefix services/workspace-auth`, `npm run check --prefix services/workspace-auth`, and `python3 scripts/check_site.py`. Browser regression: prepare Worker assets, serve `services/workspace-auth/public` on port 4173, and run `node tests/test_account.cjs` with Playwright available. Browser account fixtures test interface behavior; the backend suite tests signed Google callback routing and authorization.
