# Free Market Wildlife

Free Market Wildlife has one purpose: help people make a career out of their passion.

A buildless, black-and-white consulting and creative website for `freemarketwildlife.com`. HTML, CSS, local bitmap fonts, and vanilla JavaScript. No runtime packages, framework, server backend, or database.

## Preview

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. Use an HTTP server rather than opening HTML directly; the site uses JavaScript modules and root-relative paths.

Complete copyable HTML, CSS, JavaScript, and page templates are collected in [CODEBASE.md](CODEBASE.md).

## Structure

```text
index.html                    Full-screen landing page
portfolio/index.html          Creator showcase and pending testimonials
tanoshi/index.html            Tanoshi media showcase
contact/index.html            Email contact form
troykearns/index.html          Plain Troy links page
troykearns/statistics/index.html  Statistics page reserved for the spreadsheet
troy-kearns/index.html         Compatibility alias for Troy workspace
kat-kai/index.html             Gated four-phase creator roadmap
404.html                      Custom error page
assets/css/styles.css         Shared two-color design system
assets/js/app.js              Contact and passcode interactions
assets/js/clients.js           Public demo passcodes and folder routes
assets/js/scene.js             Static transparent scene renderer
assets/js/scene-sprites.js     Independent sprite definitions
assets/images/mark.svg         Pixel interpretation of supplied logo
assets/images/pixel/          Binary transparent landscape and bird
assets/fonts/                 Original, locally served bitmap typefaces
scripts/check_site.py          Dependency-free validation
scripts/build_pixel_font.py   Optional typeface regeneration
scripts/prepare_sprites.html   Optional browser sprite preparation studio
scripts/package_pixel_masks.py  Lossless PNG packaging from prepared masks
.github/workflows/pages.yml   GitHub Pages validation and deployment
CNAME                         freemarketwildlife.com
.nojekyll                     Static branch-hosting compatibility
```

## Current design contract

- Pure black `#000000` and pure white `#ffffff`, plus transparent pixels in the artwork.
- The landing page uses exactly **Build a Career**, **Portfolio**, **Tanoshi** in a vertical list, with no tagline beneath the title.
- The homepage wordmark starts from **Roboto Slab Regular**, rasterized through native monochrome font hinting into `fmw-clean-slab.ttf` and `fmw-clean-slab-small.ttf`. It uses normal letterforms and spacing rather than traced concept-image shapes. Source and derivative attribution are in `assets/fonts/NOTICE.txt`, with the Apache 2.0 license alongside it. Rebuild them with `scripts/build_slab_font.py` in a fonttools and Pillow development environment.
- The menu arrow appears instantly on hover or keyboard focus. No idle selection is forced.
- No CSS animations, transitions, scene timers, or requestAnimationFrame loop run.
- The viewport-sized transparent stage has independent scenery, wildlife, and foreground canvases. The landscape and perched bird are separate PNG files; butterfly masks are defined independently.
- Homepage art uses 3 CSS pixels per logical pixel on wide screens at least 700px tall, and 2 on smaller screens. Canvas output sizes are whole multiples of that pixel size, with overflow clipped at the viewport edges.
- The local display typeface and compact portrait variant use rectangular pixel contours. The emblem is copied directly from the supplied pixel-art silhouette, preserving its original contour. Navigation is real HTML, not text baked into an image.
- The landscape is a **263 × 168** white/transparent bitmap, isolated from the approved concept. The perched bird is **18 × 16**. Both are genuinely 1-bit PNGs, not merely grayscale images.
- Portrait and short screens get a different scenery composition. Art never captures pointer events or controls navigation.

Future animation can update the existing actor positions and frame definitions in a separate controller. Keep actor positions integral, retain the global pixel scale, and respect reduced-motion preferences. There is deliberately no running controller yet.

## Content and contact

Testimonials, results, channel numbers, and media sources have not been supplied. Their placeholders are labeled; no performance claim or testimonial is fabricated. Media-platform buttons currently point to the named platforms and are explicitly labeled as platform links.

The contact form validates required fields and prepares a `mailto:` message to **FreeMarketWildlife@gmail.com**. It opens the visitor's email app; the visitor still sends the message there. No form data is stored or sent to an external form service. The page contains no telephone contact field or placeholder.

## Demo client access

| Workspace | Public demonstration passcode |
| --- | --- |
| `/troykearns/` | `Password` |
| `/kat-kai/` | `KATKAI-10K` |

Edit `assets/js/clients.js` to change these values. The small top-right Sign in button opens the password dialog. A successful password routes to the matching workspace. Preview access lasts for the current browser tab through sessionStorage, avoiding a second prompt. Signing out clears that workspace session. If browser storage is blocked, the destination asks for the password again. Escape does not dismiss a workspace barrier. Regular access dialogs remain dismissible.

**This is a static interface barrier, not authentication.** Public HTML and JavaScript can be read or altered by a visitor. Only public demonstration information belongs in this repository. Confidential client work requires actual authorization on a suitable host.

## Checks

```sh
python3 scripts/check_site.py
```

The check verifies all nine pages, local references and fonts, unique element IDs, initial workspace barriers, naming, the monochrome source palette, PNG dimensions/checksums/bit depth, and absence of autonomous scene animation. Browser QA is recorded in `design/verification.md`.

To regenerate the original fonts, install `fonttools` in a development environment and run `scripts/build_pixel_font.py`. The checked-in TTF files work without that dependency. Prepared 1-bit sprite scanlines can be packaged with `python3 scripts/package_pixel_masks.py`; the page needs no build step.

## GitHub Pages

The workflow publishes only the HTML pages, assets, CNAME, and `.nojekyll`; development scripts, design references, and documentation are excluded.

1. Push this source to the intended GitHub repository's `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Set **Custom domain** to `freemarketwildlife.com` in Pages settings and configure the domain's DNS for the actual GitHub Pages account.
4. Enable **Enforce HTTPS** once GitHub has issued the certificate.

GitHub's repository website is hosted on `github.io` or the configured custom domain; `github.com` is the repository interface. Root-relative routes target the custom-domain root or a user/organization Pages site, rather than a project subpath.

For an Actions deployment, a CNAME file alone does not configure the domain. The site is now connected to FreeMarketWildlife/FreeMarketWildlife.github.io and published through GitHub Actions. HTTPS and the live Statistics page were verified. The YouTube API is enabled and its restricted key is saved in GitHub Secrets. A live collection and website display were verified.

Official references: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Troy workspace

The canonical route is `/troykearns/`; `/troy-kearns/` remains a working alias. Both currently use the exact temporary password `Password`. The channel and seven other links were supplied by the owner, including Troy's public business email. YouTube's remote page could not be fetched during development; links are preserved as supplied with YouTube redirect wrappers removed. The workspace contains a plain Links page and a separate Statistics placeholder for the future spreadsheet. There is no overview, dashboard, or analytics table yet. Typography is standard sans-serif; only the home-link logo uses pixel art.

Google and email-code authentication are deferred at the owner's request. Neither this password nor sessionStorage provides security. Before adding private material, move workspace content to a protected origin with enforced access rules covering documents, media, APIs, and alternate hostnames. Do not publish confidential material in this public repository.

## YouTube automatic updates (free starter)

The Statistics page reads `assets/data/youtube.json`. The Pages workflow runs at 16:23 UTC daily (9:23 AM Pacific daylight time / 8:23 AM Pacific standard time), on pushes to main, or manually. One channels.list request normally costs one quota unit. It fetches public subscribers (rounded), total views, and public video count. The supplied legacy username resolves the channel ID on first success; later updates use the stable ID. No channel-owner credentials are needed for these public totals.

### One-time setup

1. Sign in at https://console.cloud.google.com/ with your own Google account. Create a project named **Free Market Wildlife**. Do not start a paid trial or enable unrelated paid APIs for this starter.
2. Open **APIs & Services → Library**, find **YouTube Data API v3**, and click **Enable**.
3. Open **APIs & Services → Credentials → Create credentials → API key**. Restrict the key under **API restrictions** to **YouTube Data API v3** only. This collector runs on GitHub servers, so website/referrer restrictions do not apply; standard hosted runners do not have a stable outbound IP. Keep the key in GitHub Secrets, never in HTML, a commit, or chat. If Google offers a service-account binding, do not use that option for this public API-key collector.
4. Open https://github.com/FreeMarketWildlife/FreeMarketWildlife.github.io/settings/secrets/actions and choose **New repository secret**. Name: `YOUTUBE_API_KEY`. Value: your API key. Save it.
5. Open the repository's **Actions → Deploy static site to GitHub Pages → Run workflow → main → Run workflow**. A successful collection is shown in the run summary as **ok**. A green deployment by itself does not prove the API is connected: **not_configured** means the secret is missing, and **update_failed** means check API enablement, restrictions, quota, or the channel username.
6. Visit `/troykearns/statistics/` and check the first observation and its timestamp. Confirm that the resolved channel shown by the API is Troy's channel before relying on the numbers. Later runs happen on GitHub even with this computer off.

### History and limits

API observations are NOT committed to Git. The workflow restores its most recent `youtube-history` artifact, keeps a rolling 27 days, and stores a new artifact for two days. This leaves a buffer below YouTube's standard 30-day non-authorized statistics retention limit. If updates stop for over two days, the artifact may expire and history starts again. This is an initial short-term tracker, not a permanent archive. Long-term history needs channel-owner authorization or applicable approved YouTube terms, plus suitable storage and expiry handling.

The page shows stale data warnings and hides expired observations. Failed collections never invent zero counts. It is a static generated dataset, not a live browser request. If scheduling is disabled or publication fails, the deployed file can become stale; check failed workflows and remove/redeploy expired datasets rather than relying solely on the page hiding them. GitHub can delay scheduled jobs and automatically disables public-repository schedules after 60 days of repository inactivity; re-enable the workflow when notified. Keep short artifact retention; do not download and archive these snapshots indefinitely.

Standard GitHub-hosted Actions execution is free in public repositories. This tiny dataset uses negligible artifact storage, which still has account allowances. No Social Blade, Cloudflare, paid Google subscription, or database is required. Developer accounts and API terms still apply. The public website password remains a preview barrier, so this version collects public totals only.

References: https://developers.google.com/youtube/v3/docs/channels/list ; https://developers.google.com/youtube/terms/developer-policies ; https://docs.github.com/en/billing/concepts/product-billing/github-actions ; https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

## Public video catalog

Statistics now includes a searchable, sortable, paginated video table. The daily collector traverses every page of the channel uploads playlist, deduplicates IDs, and requests public video metadata in batches of 50. It verifies channel ownership and public visibility for each returned video. No search-result cap or deliberate recent-video limit is used. The page reports both upload IDs checked and public videos returned; private, deleted, unavailable, and unlisted records are not displayed. A complete refresh replaces the catalog; failures publish an unavailable state rather than a partial catalog.

The current catalog includes the metadata returned for snippet, statistics, contentDetails, status, liveStreamingDetails, recordingDetails, localizations, and paidProductPlacementDetails. It does not download video files, transcripts, or individual comments. Comment counts are included when available. Expand Details for descriptions, tags, languages, and all returned public metadata. Shorts are not guessed from duration because the Data API does not provide a reliable universal isShort flag. Views follow YouTube's platform definitions.

Generated catalog data is deployed as assets/data/youtube-videos.json, refreshed daily, and is never committed to Git. The tracked file is an empty setup placeholder. Full video metadata is not copied into the rolling channel-history artifact. For around 5,330 uploads a full refresh typically takes about 215 one-unit requests, within the standard quota.
