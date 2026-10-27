# Private workspace contracts

Contracts pages exist at `/kat-kai/contracts/` and `/philip-aram/contracts/`. They inherit each workspace's existing design and membership checks. No new grants, sessions, public sharing, upload endpoint or billing integration are introduced.

The Worker serves read-only lists and PDF downloads under each workspace's `/api/contracts` route, only after the existing identity and membership gate. Owner access follows the existing owner model. Membership revocation applies to the next request. Responses use private/no-store caching, noindex, nosniff and same-origin resource protection. PDF responses also use a sandbox CSP.

The existing private `TASK_PHOTOS` R2 binding stores contracts in a separate `workspace-contracts/<workspace>/` namespace; existing photo objects and routes are untouched. Each document uses a SHA-256 filename `<digest>.pdf` plus a private `<digest>.json` sidecar containing `sha256`, `title`, `filename`, `size` and `addedAt` (an ISO upload date, not a claimed signing date). The sidecar and PDF are never static assets or repository content. List responses contain only documents in the current workspace. There is no public bucket URL or signed share link.

Before installing any private document, verify current owner/membership identities, the intended audience, disabled r2.dev access and absent public custom domains. Stop installation when access cannot be verified. Preserve the supplied PDF bytes; calculate its hash before upload and verify the remote object's hash afterwards. Check existing objects before retrying an uncertain write. Add metadata last so an incomplete installation does not appear in the list. Store local source provenance and release receipts outside the repository/public build.

Run `node --test` in `services/workspace-auth` for membership, namespace, revocation, method, privacy-header and exact-byte tests. Browser tests use synthetic document metadata only; never add a real contract or screenshot of its contents to public test assets. Both protected workspace directories remain excluded from the GitHub Pages build.
