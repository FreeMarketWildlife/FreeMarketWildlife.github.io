# YouTube starter verification

Six collector tests passed: absent key, hidden subscribers, 27-day pruning/future rejection, same-day replacement, failed update preserving counts, malformed response rejection. Nine-page source checks, JavaScript syntax, and whitespace checks passed.

Published to https://freemarketwildlife.com/troykearns/statistics/ using GitHub Actions run 39103260576. Confirmed successful workflow and HTTP 200; live JSON reports not_configured with no fabricated observations. Browser verified live password entry and rendered not-connected table. Screenshot: youtube-statistics-setup.png.

Actual Google API fetch is not verified because no YOUTUBE_API_KEY has been configured. The daily scheduler and collector are installed; successful live collection still needs the owner's one-time Google project/API/secret setup. No paid accounts created.
