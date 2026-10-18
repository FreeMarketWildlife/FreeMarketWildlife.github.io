# Client social tracking

`config/social-accounts.json` is the account registry. Both Troy Kearns and Kat & Kai run through the same daily pipeline. The existing GitHub Pages workflow collects at 16:23 UTC daily and on deployment/manual dispatch. GitHub can delay scheduled runs. Failed Actions runs appear in the repository's Actions tab; collection failures are also shown in the job summary and the client interface. No browser visit is required to collect.

## Observations and storage

`scripts/social_history.py` is the platform-independent store. Its identity is client + platform + account (and YouTube channel ID). Each resource has timestamped numeric metrics. Same UTC-day retries replace that day's snapshot; subsequent days append. Null means unavailable, zero means zero, and decreases are preserved. Missing days are never synthesized. Complete successful inventories remove resources no longer public. Failed collection retains recent history without advancing observation timestamps; retention is still enforced.

YouTube's adapter collects every upload page, batches video requests, and rejects partial/failed catalogs. Views, likes and comments are saved for every returned public video. The compact current catalog drives the list; Details lazily loads only that video's historical file. Graphs show observed cumulative totals and break across missed collections. Exact timestamps and counts are available under Daily observations. A first observation appears as a dot; no earlier trend is invented.

State is restored from the latest `youtube-history` CI artifact before collection. This legacy artifact name also supports migration from channel-only state. It now carries channel histories, compact current catalogs and per-account resource histories. Artifacts expire after two days; rows expire after 27 days, keeping archived copies below 30 days. Successful daily runs continually carry the rolling window forward. A gap longer than artifact retention can reset the stored history; it cannot be reconstructed from public API data. No API history or generated history files are committed to Git. Deployment contains generated `assets/data/history/<output>/<resource>.json` files, and per-account aggregate history JSON. Public API data remains publicly downloadable under the existing static site access model.

YouTube non-authorized statistics cannot be retained beyond 30 days. This implementation enforces 27 days, even if a different retention is configured. Longer-term YouTube storage needs a separate owner-authorized integration with consent/revocation handling and regular checks. See https://developers.google.com/youtube/terms/developer-policies#e.-handling-youtube-data-and-content.

## Add a client YouTube channel

Add an account to `config/social-accounts.json` with a unique safe `output` slug, client ID, platform `youtube`, channel handle in `account`, title, URL, and `retentionDays: 27`. Set the client's statistics page `data-youtube-source` to that output and use the existing statistics markup, `youtube.js`, `social-charts.js`, and shared styles. The daily workflow automatically collects every registered account. Use the existing `YOUTUBE_API_KEY` repository secret; never put credentials in the registry or browser. Removing an account from the registry stops future collection and publication; previous CI copies expire in two days. Remove downloaded local data too when fulfilling deletion requests.

## Add another platform

Implement an official API collector and explicitly register its dispatch in `scripts/update_youtube.py` (the entrypoint keeps its historical name). Unsupported platforms fail clearly rather than appearing connected. The collector should return a complete resource inventory and metrics such as views/likes/comments, use UTC observation timestamps, and pass it to `social_history.record`. Include the platform and stable account identity, handle pagination and unavailable metrics, and respect that platform's access and retention rules. Publish the same per-resource history shape to reuse `historyPanel`. Platform credentials belong in CI secrets. Adding a registry row alone does not grant platform access or implement its API.

## Verification

Run `python3 -m unittest discover -s tests -v` and `python3 scripts/check_site.py`. Test that both live client Details panels load their own histories after deployment. Verify at least two different UTC collection days to confirm a real trend; same-day deployments intentionally leave one dot.
