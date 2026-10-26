# Free Market Wildlife games Worker

The canonical accepted public assets live at repository root `games/`. This Worker owns only the exact `/games`, `/games/*`, `/portfolio/critz/games` and `/portfolio/critz/games/*` routes on apex/www, independently of `fmw-workspaces`. Kingdom multiplayer owns only `/api/kingdom/*` through `../kingdom-multiplayer/`.

Run `python3 services/games/verify-release.py` from the repository root to check all accepted file hashes and visibility policy. Add `--build` to copy only manifest-listed files into ignored `.generated/public/games/`. Then use the existing trusted Wrangler installation with `--config services/games/wrangler.jsonc --keep-vars`. This documentation is not permission to deploy; first reconcile actual live versions, preserve current main bindings/routes and obtain accepted feature handoffs. Never deploy an older whole-site snapshot or reset unrelated route IDs.

`release-manifest.json` freezes the accepted bytes. Do not automatically accept a hash change; verify its source and QA handoff first. `release-status.json` identifies the archived live source baseline and pending work. No credentials, private browser maps, account records, source Blends or local QA harnesses belong in public assets.

`listing-visibility.json` retains six user-requested hidden IDs. `render-listing.py` regenerates both static and catalog-driven discovery from all twelve retained templates. Six builds remain accessible by direct URL: this is unlisting, not private access. Keep these flags when updating any game. Regeneration requires a reviewed manifest update before the verifier can accept changed listing bytes.

Current persisted release: static `9bebfc1d-9a90-430c-8a35-3d5f2caee0f6`, accepted Baa'd Math `c5984a292dcf6bc1a7ec30b0f9d6c132d1624e0a`, accepted Treetop v71 `559ab8c2212de5b320f367d884ab1c525e46cc7e` (weak swings/outcome FAIL, full-screen tree shop and native-popover Escape/focus/stationary-hover dismissal fix). Static assets and these sources were verified against the retained deployed manifest; public checks previously matched all nineteen latest Baa'd Math files and all 188 Treetop files.

Main Business publication is owned separately. Its last coordinated version at this snapshot was `9688d043-54ee-4b75-bed0-518c7b7cdd12`; verify current live state instead of assuming this historical value remains current.
