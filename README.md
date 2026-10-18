# Free Market Wildlife

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
troykearns/index.html          Troy channel, links, and video review workspace
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
- The landing page uses exactly **Build a Career**, **Portfolio**, **Tanoshi** in a vertical list, with **Build a Career** as the tagline.
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

The check verifies all eight pages, local references and fonts, unique element IDs, initial workspace barriers, naming, the monochrome source palette, PNG dimensions/checksums/bit depth, and absence of autonomous scene animation. Browser QA is recorded in `design/verification.md`.

To regenerate the original fonts, install `fonttools` in a development environment and run `scripts/build_pixel_font.py`. The checked-in TTF files work without that dependency. Prepared 1-bit sprite scanlines can be packaged with `python3 scripts/package_pixel_masks.py`; the page needs no build step.

## GitHub Pages

The workflow publishes only the HTML pages, assets, CNAME, and `.nojekyll`; development scripts, design references, and documentation are excluded.

1. Push this source to the intended GitHub repository's `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Set **Custom domain** to `freemarketwildlife.com` in Pages settings and configure the domain's DNS for the actual GitHub Pages account.
4. Enable **Enforce HTTPS** once GitHub has issued the certificate.

GitHub's repository website is hosted on `github.io` or the configured custom domain; `github.com` is the repository interface. Root-relative routes target the custom-domain root or a user/organization Pages site, rather than a project subpath.

For an Actions deployment, a CNAME file alone does not configure the domain. Domain and DNS setup remain external steps; this checkout has not been published or connected to a remote repository by this work.

Official references: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Troy workspace

The canonical route is `/troykearns/`; `/troy-kearns/` remains a working alias. Both currently use the exact temporary password `Password`. The channel and seven other links were supplied by the owner, including Troy's public business email. YouTube's remote page could not be fetched during development; links are preserved as supplied with YouTube redirect wrappers removed. The workspace includes an empty six-column review structure and no invented metrics.

Google and email-code authentication are deferred at the owner's request. Neither this password nor sessionStorage provides security. Before adding private material, move workspace content to a protected origin with enforced access rules covering documents, media, APIs, and alternate hostnames. Do not publish confidential material in this public repository.
