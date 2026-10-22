# Valori Corson workspace

## Scope

Exactly three tabs: Personal (`/valori-corson/`), Bookkeeping Business (`/valori-corson/bookkeeping-business/`), and Calendar (`/valori-corson/calendar/`). Both sections are empty. The calendar displays one month, with previous/next/Today controls and categories for Personal and Bookkeeping Business. Both sources start empty; the merge function is tested with synthetic fixtures only. No event entry, records, tasks, clients, finances, integrations, synchronization, or additional modules are implemented. Adding actual items remains a separate user-directed change. No private content belongs in the public repository.

Styling extends the existing monochrome client typography. Tab links work without JavaScript; the calendar requires JavaScript. Account controls reuse the existing account module. No preview passcode or public chooser entry is added.

## Existing access boundary

The repository is public and owned by the GitHub user FreeMarketWildlife. Source folders do not provide privacy. The production Cloudflare Worker enforces sessions and per-workspace D1 membership for workspace paths, including direct links. GitHub Pages deploys only explicit public directories. The proposed new route uses this same policy, without changing authentication, credentials, membership grants, visibility, or permissions. Valori has not been invited or assigned access.

The new catalog entry requires migration `0004_valori_workspace.sql`, which extends the membership table's allowed workspace identifiers while copying every existing membership unchanged. It creates no membership. A preservation test covers existing grants and rejection of unknown identifiers. Production migration has NOT been applied.

## Delivery and deployment

GitHub main pushes deploy the public-only Pages origin; they do not update the production Worker. The existing application deployment command is `npm run deploy --prefix services/workspace-auth`. Valori's directory is packaged only in Worker assets; Pages explicitly asserts its absence.

This change is prepared for a draft PR, without merge or production deployment. The existing checkout at `/Users/tanoshi/Documents/ChatGPT/FreeMarketWildlife` contains unrelated uncommitted sermon work. It was inspected read-only and left untouched. A clean clone based on main was used here, so deploying it could replace any uncommitted material already present in production. Reconcile the approved deployment source before rollout. The required production D1 schema update is also staged only; no live database or account changes were made.

After source reconciliation and approval of rollout: preserve current deployment and D1 recovery options, apply migration 0004 using the established D1 workflow, deploy Worker assets, then verify signed-out denial, owner access to all three URLs, and denial to an existing unrelated workspace member. Site membership assignment to Valori requires her verified sign-in address and separate explicit authorization. No invitation or permission change is part of this implementation.

## Valori's own GitHub, Dot, and Codex access — proposal only

1. Prefer a separate private repository containing only Valori's workspace source. Keep the parent site's account service, other workspaces, production database, and secrets outside it. The present public repository and its history remain public.
2. Once approved, invite her own verified GitHub account to that repository with the minimum role needed for branches and pull requests. Require owner review for production changes. Do not share the owner's login, tokens, browser profile, or Cloudflare credentials.
3. On her device/account, select only that repository in the GitHub app/connector installation and connect her own Dot and Codex identities. Use a checkout containing only her repository. Repository selection and local instructions reduce scope, but actual access depends on the permissions of each connector and execution environment; verify them before granting access.
4. Let the site owner integrate reviewed source into the existing protected `/valori-corson/` route through an explicit owner-controlled deployment process. Do not give her agents the root site's deployment token, D1/R2 bindings, or other workspace data. Repository separation and authenticated website membership are separate decisions.
5. If keeping one repository, repository collaborator rights remain broad and CODEOWNERS is a review mechanism, not a confidentiality boundary. Eligible private/internal paid organization setups offer push rulesets with path restrictions and allowed-path exceptions; those can constrain accepted pushes but do not hide other source folders or prevent local reads/edits. The current public user-owned repository does not fit that setup. Do not change its visibility, ownership, plan, or rules without approval.

References: [GitHub rulesets and eligibility](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets), [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

## Verification

- Static checker: 37 pages and local references pass.
- Backend suite: 23 tests pass, including new route isolation, anonymous redirect, unassigned denial, scoped membership, revocation, fail-closed configuration, and membership migration preservation.
- Calendar model: empty defaults, merged categories, chronological ordering, immutable source behavior, leap-year February and year/month boundaries pass.
- Existing Python tests: 22 pass. Existing Blog, Planner, Content Ideas, Troy Spreadsheets, and Sermons Node checks pass.
- Worker prepare-assets and Wrangler dry-run pass. No remote migration or deployment run.
- Hidden browser preview: all three tab links, empty states, month navigation and Today verified. Calendar shows October 2026 with 31 days and current-date highlight. Desktop 1440px and mobile 390px have no horizontal overflow. No Resolve/app interaction performed. Preview uses static prepared assets; signed-in account UI and real Valori login were not verified.
- Live read-only headers: `https://freemarketwildlife.com/valori-corson/` returns 404; it is not live. Existing `/philip-aram/` returns 303 to `/?signin=required`. GitHub Pages hostname redirects Valori's URL to the canonical domain. Checked 2026-10-22 UTC.
