# YouTube Studio Access tutorial

The shared guide remains at `/tutorials/youtube-stats-access/` so existing links and embeds continue working. Its visible name is **YouTube Studio Access**. Source: the tutorial HTML, `assets/js/youtube-access-tutorial.js`, shared tutorial CSS, tutorial index and Troy Connect link/embed labels.

The guide starts with no role selected. A local preview selector and accessible comparison dialog explain all seven role names in the current official table. Limited describes revenue visibility, independently of content editing. The comparison gives task-based examples and avoids defaulting every client to an editing or administration role. The Studio illustration remains passive; this page sends no invitation, grants no permission, performs no OAuth flow and stores no client data.

Official sources:
- https://support.google.com/youtube/answer/9481328?co=GENIE.Platform%3DDesktop&hl=en
- https://support.google.com/youtube/answer/9367690?hl=en

The first article's introductory count differs from its role table. The guide follows the actual table and includes the Brand Account distinction. Recheck the official table before changing capability summaries. Existing private Analytics approval is a separate mechanism and is unchanged.

Verification: `node tests/test_tutorials.mjs`, `python3 scripts/check_site.py`, browser tests at desktop/mobile widths, keyboard dialog/role selection, all seven steps/roles, no horizontal overflow, and no network writes. Deploy only the five tutorial-related public assets over a freshly verified main Worker release. Preserve the main Worker bundle, bindings, routes and every other public asset; record source and live hashes. GitHub source push and the Worker publication are separate results.
