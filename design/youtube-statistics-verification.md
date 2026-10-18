# YouTube starter verification

Six collector tests passed: absent key, hidden subscribers, 27-day pruning/future rejection, same-day replacement, failed update preserving counts, malformed response rejection. Nine-page source checks, JavaScript syntax, and whitespace checks passed.

Published to https://freemarketwildlife.com/troykearns/statistics/ using GitHub Actions run 39103260576. Confirmed successful workflow and HTTP 200; live JSON reports not_configured with no fabricated observations. Browser verified live password entry and rendered not-connected table. Screenshot: youtube-statistics-setup.png.

Actual Google API fetch is not verified because no YOUTUBE_API_KEY has been configured. The daily scheduler and collector are installed; successful live collection still needs the owner's one-time Google project/API/secret setup. No paid accounts created.

## Connected and verified

Google Cloud project voltaic-sensor-512006-f6 now has YouTube Data API v3 enabled. The key named Free Market Wildlife YouTube tracker was created with only YouTube Data API v3 allowed; verified in the Google credentials listing. YOUTUBE_API_KEY was saved as a repository secret through GitHub. No key is stored in this checkout.

Run 39103885201 succeeded, returned collector status ok, and deployed the first real observation. Browser verified the live timestamp and all three count fields. Resolved channel ID matched the channel's own public Posts link. The channel uses a handle rather than the initially assumed legacy username; the collector now falls back to handle resolution. The seven collector tests include this regression case. Counts and screenshots of live counts are intentionally not committed into permanent Git history.
