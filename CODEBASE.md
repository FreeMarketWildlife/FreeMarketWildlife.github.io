# Free Market Wildlife — complete source code

The actual editable files live at the paths below. Local font and sprite files are included in the repository. See README.md for preview, design contracts, and deployment setup.

```text
index.html
assets/css/styles.css
assets/css/troy.css
assets/js/app.js
assets/js/clients.js
assets/js/scene.js
assets/js/scene-sprites.js
portfolio/index.html
tanoshi/index.html
contact/index.html
troy-kearns/index.html
troykearns/index.html
troykearns/statistics/index.html
kat-kai/index.html
404.html
.github/workflows/pages.yml
CNAME
```

## index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="Free Market Wildlife. Build a Career. Explore the portfolio, Tanoshi, or start a conversation.">
  <title>Free Market Wildlife — Build a Career</title>
  <link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/fmw-slab-reference.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/assets/fonts/fmw-pixel.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="module" src="/assets/js/app.js?v=2"></script>
  <script type="module" src="/assets/js/scene.js"></script>
</head>
<body class="home">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="pixel-scene" aria-hidden="true" data-pixel-scene data-animation="off">
    <canvas data-scene-layer="scenery"></canvas>
    <canvas data-scene-layer="wildlife"></canvas>
    <canvas data-scene-layer="foreground"></canvas>
  </div>
  <main class="landing" id="main" tabindex="-1">
    <div class="landing-copy">
      <img class="landing-logo" src="/assets/images/mark.svg" width="96" height="96" alt="Free Market Wildlife emblem">
      <h1>Free Market<br>Wildlife</h1>
      <nav class="landing-nav" aria-label="Primary">
        <a href="/contact/"><span class="menu-arrow" aria-hidden="true"></span>Build a Career</a>
        <a href="/portfolio/"><span class="menu-arrow" aria-hidden="true"></span>Portfolio</a>
        <a href="/tanoshi/"><span class="menu-arrow" aria-hidden="true"></span>Tanoshi</a>
      </nav>
    </div>
  </main>
  <button class="home-access" type="button" data-open-access aria-label="Sign in"><span>Sign in</span></button>
  <dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title">
  <div class="dialog-panel">
    <button class="close-button" type="button" data-close-access aria-label="Close client access">×</button>
    <span class="eyebrow">CLIENT WORKSPACE</span>
    <div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div>
    <h2 id="access-title">Sign in.</h2>
    <p class="muted">Enter your workspace password to continue.</p>
    <form data-access-form>
      <label for="access-code">Password</label>
      <input id="access-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="access-error" placeholder="Enter password">
      <p class="form-error" id="access-error" aria-live="polite"></p>
      <button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="micro">Temporary preview access. Public content only.</p>
  </div>
</dialog>
</body>
</html>
```

## assets/css/styles.css

```css
/* All authored surfaces are strictly black, white, or transparent.
   Pixel scale is shared by the homepage font, emblem, sprites, and cursor. */
@font-face { font-family: "FMW Pixel"; src: url("../fonts/fmw-pixel.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "FMW Display"; src: url("../fonts/fmw-display.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "FMW Display Narrow"; src: url("../fonts/fmw-display-narrow.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }
:root { --black: #000; --white: #fff; --pixel: 2px; --space: calc(var(--pixel) * 8); font-family: "FMW Pixel", monospace; color-scheme: dark; color: var(--white); background: var(--black); }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--black); color: var(--white); }
body { font-size: calc(var(--pixel) * 8); line-height: 1.75; font-synthesis: none; }
button, input, textarea { font: inherit; border-radius: 0; }
button, a, input, textarea { -webkit-tap-highlight-color: transparent; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; color: inherit; }
button, input, textarea { background: var(--black); border: 1px solid var(--white); }
img, canvas, svg { image-rendering: pixelated; }
h1, h2, h3, p { margin: 0; font-weight: 400; }
h1 { font-family: "FMW Display", "FMW Pixel", monospace; font-size: 48px; line-height: 1.25; }
h2 { font-size: 24px; line-height: 1.5; }h3 { font-size: 24px; line-height: 1.5; }
p { line-height: 1.75; }
::selection { background: var(--white); color: var(--black); }
:focus-visible { outline: 2px dashed var(--white); outline-offset: 6px; }
[hidden] { display: none !important; }
/* No transitions, CSS animations, or autonomous scene update loop in this release. */
.eyebrow, .micro, .badge, .site-footer { font-size: 16px; line-height: 1.75; }
.eyebrow, .badge { text-transform: uppercase; }
.status-dot { display: inline-block; width: 6px; height: 6px; margin-right: 8px; background: var(--white); vertical-align: middle; }
.accent, .muted, .unlocked { color: var(--white); }
.site-header { max-width: 1440px; min-height: 128px; padding: 32px 48px; margin: auto; display: flex; justify-content: space-between; align-items: center; gap: 32px; }
.brand { display: inline-flex; align-items: center; gap: 16px; flex-shrink: 0; }.brand img { width: 64px; height: 64px; }.brand > span { font-size: 16px; line-height: 1.5; }
.site-header nav { display: flex; gap: 32px; align-items: center; }.site-header nav a { text-transform: uppercase; }.site-header nav a:hover, .site-header nav a[aria-current] { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 8px; }
.access-button, .home-access { display: inline-flex; align-items: center; gap: 12px; background: var(--black); padding: 12px 16px; text-transform: uppercase; }
.access-button { border: 0; }.access-button:hover, .home-access:hover { text-decoration: underline; text-underline-offset: 6px; }
.pixel-lock { display: inline-block; width: 24px; height: 28px; object-fit: contain; vertical-align: middle; flex-shrink: 0; }
.site-footer { max-width: 1440px; margin: 32px auto 0; padding: 24px 48px 40px; border-top: 1px solid var(--white); display: flex; justify-content: space-between; gap: 32px; }
.skip-link { position: fixed; top: -100px; left: 24px; z-index: 100; padding: 12px; color: var(--black); background: var(--white); }.skip-link:focus { top: 16px; }
/* Full-viewport transparent stage. Text and controls remain semantic DOM. */
.home { --pixel: 3px; height: 100vh; height: 100dvh; overflow: hidden; font-size: calc(var(--pixel) * 8); }
.pixel-scene { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.pixel-scene canvas { position: absolute; top: 0; left: 0; display: block; }
.landing { position: relative; width: 100%; height: 100%; z-index: 1; padding: 60px 72px; }
.landing-copy { width: max-content; max-width: 100%; }
.landing-logo { display: block; width: calc(var(--pixel) * 32); height: calc(var(--pixel) * 32); margin-bottom: calc(var(--pixel) * 10); }
.landing h1 { font-family: "FMW Display", monospace; text-transform: uppercase; font-size: calc(var(--pixel) * 24); line-height: 1.125; margin: 0; }
.landing-tagline { margin-top: calc(var(--pixel) * 8); line-height: 1; font-size: calc(var(--pixel) * 8); }
.landing-nav { display: flex; flex-direction: column; gap: calc(var(--pixel) * 4); align-items: flex-start; margin-top: calc(var(--pixel) * 20); }
.landing-nav a { position: relative; display: block; line-height: 1; padding: calc(var(--pixel) * 4) 0; min-height: 44px; text-transform: uppercase; font-size: calc(var(--pixel) * 8); }
.menu-arrow { position: absolute; left: calc(var(--pixel) * -11); top: 50%; width: calc(var(--pixel) * 7); height: calc(var(--pixel) * 9); margin-top: calc(var(--pixel) * -5); background: url("../images/arrow.svg") no-repeat 0 0 / 100% 100%; visibility: hidden; }
@media (hover: hover) { .landing-nav a:hover .menu-arrow { visibility: visible; } }
.landing-nav a:focus-visible .menu-arrow { visibility: visible; }
.landing-nav a:focus-visible { outline: 0; text-decoration: underline; text-decoration-thickness: var(--pixel); text-underline-offset: calc(var(--pixel) * 4); }
.home-access { position: fixed; bottom: 24px; right: 48px; z-index: 2; border: 0; font-size: calc(var(--pixel) * 8); padding: calc(var(--pixel) * 4); }
.home-access .pixel-lock { width: calc(var(--pixel) * 12); height: calc(var(--pixel) * 14); }
/* Quiet, open monochrome interiors. */
.page-main { max-width: 1360px; padding: 48px; margin: 0 auto; min-height: calc(100vh - 240px); }
.page-heading { display: flex; justify-content: space-between; gap: 64px; align-items: flex-end; margin-bottom: 64px; }.page-heading h1 { margin-top: 24px; }.page-heading > p { max-width: 384px; }
.section-rule { display: flex; justify-content: space-between; align-items: center; gap: 24px; border-top: 1px solid var(--white); padding: 24px 0; }.section-rule h2 { font-size: 16px; }
.badge { display: inline-block; border: 1px solid var(--white); padding: 4px 8px; }
.editorial-note { max-width: 960px; padding-bottom: 32px; }
.panel { background: var(--black); border: 1px solid var(--white); }
.creator-row { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 48px; }.creator-visual { padding: 32px; min-height: 352px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; border-right: 1px solid var(--white); }.creator-monogram { font-family: "FMW Display", monospace; font-size: 72px; align-self: center; line-height: 1.25; }.creator-monogram span { font-family: "FMW Pixel", monospace; font-size: 32px; }.creator-story { padding: 40px; }.creator-story h2 { margin: 16px 0; }.creator-story > p { margin-bottom: 24px; }
blockquote { border-left: 2px solid var(--white); padding-left: 24px; margin: 24px 0; }blockquote footer { margin-top: 16px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 16px; margin: 24px 0; }.tag-row span { border-bottom: 1px solid var(--white); padding-bottom: 4px; }.text-button { display: inline-flex; align-items: center; gap: 12px; background: var(--black); border: 0; padding: 0; line-height: 1.75; }.text-button:hover { text-decoration: underline; text-underline-offset: 6px; }.text-button .pixel-lock { width: 12px; height: 14px; }
.reverse .creator-visual { order: 2; border-right: 0; border-left: 1px solid var(--white); }.bottom-cta { display: flex; justify-content: space-between; align-items: center; gap: 32px; padding: 32px; margin-top: 48px; }.bottom-cta h2 { margin-top: 16px; }.round-arrow { font-size: 32px; }.bottom-cta:hover { background: var(--white); color: var(--black); }
.studio-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; }.module-heading { padding: 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid var(--white); }.module-copy { padding: 32px; display: flex; flex-direction: column; align-items: flex-start; gap: 24px; }
.video-wrapper { position: relative; }.video-wrapper video { display: block; width: 100%; aspect-ratio: 320 / 180; }.media-note { display: block; padding: 16px 24px; border-top: 1px solid var(--white); border-bottom: 1px solid var(--white); font-size: 16px; }.audio-placeholder { display: flex; align-items: center; gap: 16px; border: 1px dashed var(--white); width: 100%; padding: 16px; }.record-art { display: grid; place-items: center; padding: 32px; border-bottom: 1px solid var(--white); }.record-art > div { width: 128px; height: 128px; background: repeating-linear-gradient(0deg, var(--white) 0 2px, var(--black) 2px 8px); display: grid; place-items: center; }.record-art span { background: var(--black); border: 2px solid var(--white); padding: 12px; text-align: center; }.worlds-module { display: flex; align-items: center; gap: 32px; padding: 32px; }.worlds-module h2 { margin: 16px 0; }.worlds-module .badge { margin-top: 24px; }.world-art { font-size: 64px; }.studio-contact { display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 32px; padding: 32px; }.studio-contact:hover { outline: 2px solid var(--white); outline-offset: -8px; }.card-link { display: flex; justify-content: space-between; gap: 24px; width: 100%; }
.contact-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px; }.contact-details, .contact-form-panel { padding: 32px; }.contact-details h2, .contact-form-panel h2 { margin: 24px 0; }.email-link { display: block; overflow-wrap: anywhere; margin: 32px 0 24px; }.email-link:hover { text-decoration: underline; text-underline-offset: 6px; }.contact-note { border-top: 1px solid var(--white); margin-top: 48px; padding-top: 24px; display: flex; align-items: baseline; gap: 16px; }
label { display: block; margin-bottom: 12px; }input, textarea { width: 100%; min-height: 48px; display: block; padding: 12px 16px; color: var(--white); background: var(--black); caret-color: var(--white); appearance: none; }input::placeholder, textarea::placeholder { color: var(--white); opacity: 1; }input:focus, textarea:focus { outline: 2px solid var(--white); outline-offset: 4px; }input[aria-invalid="true"] { outline: 2px dashed var(--white); outline-offset: 4px; }input:-webkit-autofill { -webkit-text-fill-color: var(--white); -webkit-box-shadow: 0 0 0 1000px var(--black) inset; }textarea { resize: vertical; min-height: 160px; }.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 32px 0 24px; }.form-help, .form-status { margin-top: 24px; }.button { display: inline-flex; align-items: center; justify-content: space-between; min-height: 48px; gap: 32px; padding: 12px 16px; border: 1px solid var(--white); }.primary { background: var(--white); color: var(--black); }.primary:hover { background: var(--black); color: var(--white); }.contact-form-panel .button { margin-top: 24px; }
/* Immediate, accessible passcode barriers; no fade or shake animation. */
dialog { background: var(--black); color: var(--white); border: 1px solid var(--white); padding: 0; border-radius: 0; }dialog::backdrop { background: var(--black); }.access-dialog { max-width: min(560px, calc(100% - 32px)); max-height: calc(100dvh - 32px); }.dialog-panel { position: relative; padding: 40px; }.dialog-panel h2 { font-family: "FMW Pixel", monospace; font-size: 32px; line-height: 1.5; margin: 24px 0; }.dialog-panel form { margin-top: 32px; }.dialog-panel .button { width: 100%; }.dialog-panel .micro { margin-top: 24px; }.dialog-panel .text-button { margin-top: 24px; }.close-button { position: absolute; right: 16px; top: 8px; border: 0; padding: 8px; font-size: 24px; }.lock-emblem { margin-top: 24px; }.form-error { min-height: 28px; margin: 12px 0; }.gate-dialog { position: fixed; inset: 0; margin: 0; width: 100%; height: 100%; max-width: none; max-height: none; border: 0; padding: 32px; overflow-y: auto; }.gate-shell { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 32px; }.gate-shell .dialog-panel { max-width: 560px; margin: auto; border: 1px solid var(--white); }.gate-shell > .brand { align-self: flex-start; }.gate-shell > .micro { text-align: center; }
.workspace-bar, .workspace-bar > div { display: flex; align-items: center; justify-content: space-between; gap: 24px; }.workspace-bar { margin-bottom: 48px; }.summary-grid { display: grid; grid-template-columns: 1.2fr .8fr 1fr; gap: 24px; margin-bottom: 32px; }.summary-card { padding: 24px; }.summary-card h2 { margin: 24px 0 16px; }.metric { display: block; font-size: 48px; margin: 16px 0; font-weight: 400; }.performance-panel { overflow: hidden; }.performance-panel h2 { margin-top: 16px; }.table-help { padding: 24px; }.table-scroll { overflow-x: auto; overscroll-behavior-inline: contain; }table { width: 100%; min-width: 1400px; border-collapse: collapse; text-align: left; }th, td { padding: 24px; border-top: 1px solid var(--white); border-right: 1px solid var(--white); vertical-align: top; font-weight: 400; }th:last-child, td:last-child { border-right: 0; }thead th { text-decoration: underline; text-underline-offset: 6px; }tbody th { min-width: 192px; }td small { display: block; font-size: 16px; }.insight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px; }.note-card { padding: 24px; }.note-card h2 { margin: 24px 0 16px; }.roadmap-intro { display: grid; grid-template-columns: 1.4fr .6fr 1fr; gap: 32px; align-items: center; padding: 32px; margin-bottom: 48px; }.roadmap-intro h2 { font-family: "FMW Display", monospace; font-size: 48px; line-height: 1.5; margin: 24px 0; }.roadmap-meta { border-left: 1px solid var(--white); padding-left: 24px; }.roadmap-meta strong { display: block; margin: 24px 0; font-weight: 400; }.target-mark { font-size: 48px; text-align: center; }.target-mark span span { font-size: 24px; }.timeline { list-style: none; padding: 0; margin: 0; max-width: 1000px; }.timeline-item { display: grid; grid-template-columns: 48px 1fr; gap: 24px; position: relative; padding-bottom: 32px; }.timeline-item:not(:last-child)::before { content: ""; position: absolute; top: 48px; bottom: 0; left: 23px; width: 2px; background: var(--white); }.phase-number { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid var(--white); background: var(--black); }.phase-card { padding: 32px; }.card-top { display: flex; justify-content: space-between; align-items: center; gap: 24px; }.phase-card h3 { margin: 24px 0; }.phase-tasks { list-style: none; padding: 0; margin: 24px 0; }.phase-tasks li { position: relative; padding-left: 32px; margin: 16px 0; }.phase-tasks li::before { content: ""; position: absolute; left: 0; top: 8px; width: 12px; height: 12px; border: 2px solid var(--white); }.phase-outcome { border-top: 1px solid var(--white); padding-top: 24px; }.phase-outcome p { margin-top: 16px; }.not-found h1 { margin: 32px 0; }.not-found .button { margin-top: 32px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 1099px) {
  .home { --pixel: 2px; }.landing { padding: 48px 48px; }.home-access { right: 32px; bottom: 24px; }.site-header { padding: 24px; gap: 24px; flex-wrap: wrap; }.site-header nav { gap: 24px; }.site-header .brand > span { display: none; }.page-main { padding: 32px; }.page-heading { gap: 32px; }.page-heading h1 { font-size: 48px; }.page-heading > p { max-width: 320px; }.creator-story { padding: 24px; }.contact-grid, .studio-grid { gap: 24px; }.form-row { grid-template-columns: 1fr; }.summary-grid { grid-template-columns: 1fr 1fr; }.summary-card:last-child { grid-column: 1 / -1; }.roadmap-intro { grid-template-columns: 1fr 1fr; }.roadmap-meta { grid-column: 1 / -1; border-left: 0; border-top: 1px solid var(--white); padding: 24px 0 0; }.world-art { display: none; }
}
@media (max-width: 680px) {
  .landing { padding: 32px; }.landing h1 { font-family: "FMW Display Narrow", "FMW Pixel", monospace; }.landing-logo { margin-bottom: 24px; }.landing-tagline { margin-top: 24px; }.landing-nav { margin-top: 32px; gap: 8px; }.landing-nav a { min-height: 44px; padding: 14px 0; }.menu-arrow { left: -22px; }.home-access { right: 16px; bottom: 16px; padding: 8px; font-size: 16px; }
  .site-header { padding: 24px; gap: 24px; }.site-header .brand > span { display: inline; }.site-header nav { order: 3; width: 100%; justify-content: space-between; gap: 16px; }.access-button { padding: 0; }.access-button > span { display: none; }.page-main { padding: 32px 24px; }.page-heading { display: block; margin-bottom: 40px; }.page-heading h1 { font-family: "FMW Display Narrow", monospace; font-size: 48px; }.page-heading > p { margin-top: 32px; max-width: none; }.section-rule { flex-wrap: wrap; gap: 16px; }.creator-row, .studio-grid, .contact-grid, .summary-grid, .insight-grid { grid-template-columns: 1fr; }.creator-visual { min-height: 240px; border-right: 0; border-bottom: 1px solid var(--white); padding: 24px; }.reverse .creator-visual { order: 0; border-left: 0; }.creator-monogram { font-size: 48px; }.creator-story { padding: 24px; }.summary-card:last-child { grid-column: auto; }.site-footer { display: block; padding: 24px; margin-top: 24px; }.site-footer > span { display: block; margin-bottom: 16px; }.bottom-cta, .worlds-module, .studio-contact, .contact-details, .contact-form-panel, .module-copy { padding: 24px; }.contact-details .email-link { font-size: 16px; }.bottom-cta .round-arrow { display: none; }.workspace-bar { align-items: flex-start; gap: 24px; }.workspace-bar > div { align-items: flex-end; flex-direction: column; }.workspace-bar .badge { font-size: 16px; }.workspace-bar > a { max-width: 40%; }.roadmap-intro { grid-template-columns: 1fr; padding: 24px; }.target-mark { display: none; }.roadmap-intro h2 { font-family: "FMW Display Narrow", monospace; font-size: 48px; }.timeline-item { grid-template-columns: 32px 1fr; gap: 16px; }.phase-number { width: 32px; height: 40px; }.timeline-item:not(:last-child)::before { left: 15px; top: 40px; }.phase-card { padding: 24px; }.card-top { flex-wrap: wrap; gap: 16px; }.phase-card h3 { font-size: 24px; overflow-wrap: anywhere; }.phase-tasks li { padding-left: 24px; }.module-heading { flex-wrap: wrap; padding: 24px; }.dialog-panel { padding: 32px 24px; }.dialog-panel h2 { font-size: 32px; }.gate-dialog { padding: 24px 16px; }.gate-shell .brand > span { font-size: 16px; }.gate-shell .dialog-panel { padding: 24px; }.media-note { overflow-wrap: anywhere; }
}
@media (max-width: 359px) { .landing { padding: 24px; }.landing-logo { width: 64px; height: 64px; }.landing-nav { margin-top: 24px; }.site-header .brand > span { display: none; }.page-heading h1 { overflow-wrap: anywhere; }.page-main { padding-left: 16px; padding-right: 16px; }.timeline-item { grid-template-columns: 24px 1fr; gap: 8px; }.phase-number { width: 24px; }.timeline-item:not(:last-child)::before { left: 11px; }.phase-card { padding: 16px; } }
@media (max-height: 699px) { .home { --pixel: 2px; }.home .landing { padding-top: 24px; }.home .landing-logo { width: calc(var(--pixel) * 32); height: calc(var(--pixel) * 32); margin-bottom: 16px; }.home .landing-nav { margin-top: 24px; gap: 0; }.home .landing-tagline { margin-top: 16px; } }
@media (max-height: 480px) and (orientation: landscape) { .home { --pixel: 2px; }.landing { padding: 24px 48px; }.landing h1 { font-family: "FMW Display Narrow", monospace; font-size: 48px; }.home .landing-logo { position: absolute; right: 32px; top: 24px; width: 64px; height: 64px; }.home .landing-nav { margin-top: 16px; }.landing-nav a { min-height: 40px; padding: 12px 0; }.home-access { right: 16px; bottom: 16px; }.home .landing-tagline { margin-top: 16px; } }
/* Browser-owned scroll controls also follow the two-color palette. */
* { scrollbar-color: var(--white) var(--black); }
::-webkit-scrollbar { width: 8px; height: 8px; background: var(--black); }
::-webkit-scrollbar-thumb { background: var(--white); border: 2px solid var(--black); }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner, ::-webkit-resizer { background: var(--black); }
/* Quiet sign-in control stays in the top-right on all viewport sizes. */
.home .home-access { top: 16px; right: 24px; bottom: auto; font-size: 12px; min-height: 44px; padding: 12px 0; display: inline-flex; align-items: center; gap: 8px; }
.home .home-access .pixel-lock { width: 12px; height: 14px; }
.site-header > .access-button { border: 0; font-size: 12px; margin-left: auto; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; }
.site-header > .access-button .pixel-lock { width: 12px; height: 14px; }
.site-header > .access-button > span { display: inline; }
.home-access:hover, .site-header > .access-button:hover { text-decoration: underline; text-underline-offset: 6px; }
.access-dialog .dialog-panel { padding: 32px; }
.access-dialog .dialog-panel h2 { font-size: 32px; margin: 16px 0; }
.access-dialog .dialog-panel form { margin-top: 24px; }
.access-dialog .dialog-panel > p, .access-dialog label, .access-dialog input, .access-dialog .button, .access-dialog .form-error { font-size: 16px; }
.access-dialog .dialog-panel .micro { font-size: 11px; }
.access-dialog .lock-emblem { margin-top: 16px; }
@media (max-width: 540px) { .access-dialog .dialog-panel { padding: 24px; } }

/* Preserve the exact supplied silhouette without stretching its proportions. */
.landing-logo, .brand img { object-fit: contain; }

/* A quiet, tiny copy of the supplied emblem; no reinterpretation. */
.home .landing-logo { width: 24px; height: 24px; margin-bottom: 24px; }
/* Centre the arrow against the actual text line, including roomy hit areas. */
.landing-nav .menu-arrow { top: calc(var(--pixel) * 4); margin-top: calc(var(--pixel) * -1); }
@media (max-width: 680px) { .landing-nav .menu-arrow { top: 14px; } }
@media (max-height: 480px) and (orientation: landscape) { .landing-nav .menu-arrow { top: 12px; } }
/* Approved Pixel Slab direction: real text, original bitmap slab-serif fonts. */
@font-face { font-family: "FMW Slab Reference"; src: url("../fonts/fmw-slab-reference.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "FMW Slab Small"; src: url("../fonts/fmw-slab-small.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }
.home .landing h1 { font-family: "FMW Slab Reference", monospace; font-size: calc(var(--pixel) * 24); line-height: calc(var(--pixel) * 25); }
@media (max-width: 680px) { .home .landing h1 { font-family: "FMW Slab Small", monospace; font-size: calc(var(--pixel) * 16); line-height: calc(var(--pixel) * 17); } }
@media (max-height: 480px) and (orientation: landscape) { .home .landing h1 { font-family: "FMW Slab Small", monospace; font-size: calc(var(--pixel) * 16); line-height: calc(var(--pixel) * 17); } }
```

## assets/css/troy.css

```css
/* Plain black-and-white client pages. Only the home logo uses pixel art. */
:root { color-scheme: dark; font-family: Arial, Helvetica, sans-serif; background: #000; color: #fff; }
* { box-sizing: border-box; }
body { margin: 0; font-size: 16px; line-height: 1.6; background: #000; color: #fff; }
a { color: #fff; text-underline-offset: 3px; }
button, input { font: inherit; color: #fff; background: #000; border: 1px solid #fff; border-radius: 0; }
button { cursor: pointer; padding: 6px 12px; }
header { display: flex; align-items: center; gap: 32px; padding: 20px 24px; }
header img { display: block; image-rendering: pixelated; }
nav { display: flex; gap: 24px; } nav a[aria-current] { font-weight: bold; }
header button { margin-left: auto; border: 0; font-size: 13px; }
main { padding: 16px 24px 48px; max-width: 960px; }
h1 { font-size: 24px; margin: 0 0 20px; }
ul { margin: 0; padding-left: 20px; } li { margin-bottom: 12px; overflow-wrap: anywhere; }
main:focus { outline: none; }
[hidden] { display: none !important; }
:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
dialog { color: #fff; background: #000; border: 0; }
dialog::backdrop { background: #000; }
.gate-dialog { position: fixed; inset: 0; margin: 0; padding: 24px; width: 100%; height: 100%; max-width: none; max-height: none; }
.gate-shell { min-height: 100%; display: flex; flex-direction: column; }
.brand img { width: 40px; height: 40px; image-rendering: pixelated; }.brand span,.gate-shell > .micro { display: none; }
.dialog-panel { width: min(100%,360px); margin: auto; padding: 32px 0; }
.eyebrow { font-size: 13px; } h2 { font-size: 24px; margin: 16px 0; }
form { margin-top: 24px; } label { display: block; margin-bottom: 8px; }
input { width: 100%; padding: 10px; } .form-error { min-height: 26px; margin: 8px 0; }
form button { width: 100%; text-align: left; padding: 10px; }.button span { float: right; }
.micro { font-size: 12px; margin-top: 20px; }.text-button { display: inline-block; margin-top: 12px; }
@media(max-width: 480px) { header { gap: 20px; padding: 16px; } nav { gap: 16px; } main { padding: 16px; } header button { padding: 6px 0; } }
```

## assets/js/app.js

```javascript
import { clients, clientForPasscode } from './clients.js?v=2';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
$$('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });

function rejectPasscode(input, error, message) {
  error.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  input.select();
}
function resetError(input, error) {
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  });
}

// Temporary browser-only preview access; this is not authentication.
// Session storage avoids asking twice when moving from the launcher to a page.
const previewKey = client => `fmw-preview:${client}`;
function rememberPreview(client) {
  try { sessionStorage.setItem(previewKey(client), 'open'); } catch { /* Direct gate still works. */ }
}
function hasPreview(client) {
  try { return sessionStorage.getItem(previewKey(client)) === 'open'; } catch { return false; }
}
function forgetPreview(client) {
  try { sessionStorage.removeItem(previewKey(client)); } catch { /* No persisted state. */ }
}
// A shared password launcher routes directly to the matching folder.
const access = $('#access-dialog');
const accessForm = $('[data-access-form]');
const accessInput = $('#access-code');
const accessError = $('#access-error');
if (access && accessForm) {
  $$('[data-open-access]').forEach(button => button.addEventListener('click', () => {
    accessForm.reset();
    accessError.textContent = '';
    accessInput.removeAttribute('aria-invalid');
    access.showModal();
    accessInput.focus();
  }));
  $('[data-close-access]').addEventListener('click', () => access.close());
  resetError(accessInput, accessError);
  accessForm.addEventListener('submit', event => {
    event.preventDefault();
    const client = clientForPasscode(accessInput.value.trim());
    if (client) {
      const clientId = Object.keys(clients).find(id => clients[id] === client);
      rememberPreview(clientId);
      location.assign(client.path);
    }
    else rejectPasscode(accessInput, accessError, 'Password not recognized. Check it and try again.');
  });
}

// Workspaces require the demo password once per tab session.
const gate = $('#workspace-gate');
const workspace = $('#workspace-content');
if (gate && workspace) {
  const form = $('[data-gate-form]');
  const input = $('#gate-code');
  const error = $('#gate-error');
  const client = clients[document.body.dataset.client];
  const revealWorkspace = () => {
    workspace.hidden = false;
    if (gate.open) gate.close();
    workspace.inert = false;
    $('#main').focus({ preventScroll: true });
    form.reset();
  };
  const openGate = () => {
    forgetPreview(document.body.dataset.client);
    workspace.hidden = true;
    workspace.inert = true;
    if (gate.open) gate.close();
    gate.showModal();
    form.reset();
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    input.focus();
  };
  // Convert the immediately visible HTML barrier into a focus-trapping dialog.
  gate.removeAttribute('open');
  if (hasPreview(document.body.dataset.client)) revealWorkspace();
  else openGate();
  gate.addEventListener('cancel', event => event.preventDefault());
  resetError(input, error);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!client || input.value.trim() !== client.passcode) {
      rejectPasscode(input, error, 'Incorrect workspace password. Please try again.');
      return;
    }
    rememberPreview(document.body.dataset.client);
    revealWorkspace();
  });
  $('[data-lock-workspace]').addEventListener('click', openGate);
  // Re-lock restored history entries after signing out.
  window.addEventListener('pageshow', event => {
    if (event.persisted && !hasPreview(document.body.dataset.client)) openGate();
  });
}

const email = 'FreeMarketWildlife@gmail.com';
const contactForm = $('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get('name')).trim();
    const from = String(data.get('email')).trim();
    const message = String(data.get('message')).trim();
    if (!name || !message) {
      $('#contact-status').textContent = 'Please enter your name and a message before continuing.';
      return;
    }
    const subject = `Website inquiry from ${name.replace(/[\r\n]/g, ' ')}`;
    const body = `Name: ${name}\nEmail: ${from}\n\n${message}`;
    location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#contact-status').textContent = 'Email handoff prepared. Send it from your mail app. If no app opens, copy the address and send your message directly.';
  });
}
const copyButton = $('[data-copy-email]');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const status = $('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(email);
      status.textContent = 'Email address copied.';
    } catch {
      status.textContent = `Copy this address: ${email}`;
    }
  });
}
```

## assets/js/clients.js

```javascript
/** Public static configuration. These strings are visible in source, not secrets.
 * Replace demo codes before sharing. Never store confidential material here.
 */
export const clients = Object.freeze({
  'troy-kearns': Object.freeze({ passcode: 'Password', path: '/troykearns/' }),
  'kat-kai': Object.freeze({ passcode: 'KATKAI-10K', path: '/kat-kai/' }),
});
export function clientForPasscode(passcode) {
  return Object.values(clients).find(client => client.passcode === passcode);
}
```

## assets/js/scene.js

```javascript
import { loadSceneSprites } from './scene-sprites.js';

/** A transparent, viewport-sized, event-rendered stage. No animation runs.
 * Future motion belongs in a separate controller that updates actor transforms
 * and requests a render. Never scale individual sprites independently.
 */
const stage = document.querySelector('[data-pixel-scene]');
if (stage) {
  const layers = new Map([...stage.querySelectorAll('canvas')].map(canvas => [canvas.dataset.sceneLayer, canvas]));
  let sprites;
  const state = {
    animation: false,
    actors: [
      { id: 'perched-bird', sprite: 'bird', frame: 0, layer: 'wildlife', visible: true },
      { id: 'butterfly-one', sprite: 'butterfly', frame: 0, layer: 'wildlife', visible: true },
      { id: 'butterfly-two', sprite: 'butterfly', frame: 0, layer: 'wildlife', visible: true },
    ],
  };
  function render() {
    const pixel = parseInt(getComputedStyle(document.body).getPropertyValue('--pixel'), 10);
    const columns = Math.ceil(stage.clientWidth / pixel);
    const rows = Math.ceil(stage.clientHeight / pixel);
    const contexts = new Map();
    for (const [name, canvas] of layers) {
      canvas.width = columns;
      canvas.height = rows;
      canvas.style.width = `${columns * pixel}px`;
      canvas.style.height = `${rows * pixel}px`;
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = false;
      contexts.set(name, context);
    }
    stage.dataset.pixelSize = String(pixel);
    stage.dataset.grid = `${columns}x${rows}`;
    if (!sprites) return;
    const portrait = stage.clientWidth <= 680;
    const compact = portrait && stage.clientHeight < 700;
    const shortLandscape = !portrait && stage.clientHeight < 480;
    // Mobile gets a compact composition, with every output pixel still on the
    // same grid. Only scenery is cropped; the DOM navigation is never scaled.
    const landscapeWidth = compact ? 184 : 263;
    const landscapeHeight = compact ? 118 : 168;
    let x = columns - landscapeWidth + (portrait ? 30 : 0);
    let y = rows - landscapeHeight - (portrait ? 32 : 0);
    if (shortLandscape) { x = columns - 230; y = rows - 148; }
    x = Math.round(x); y = Math.round(y);
    contexts.get('scenery').drawImage(sprites.landscape, x, y, landscapeWidth, landscapeHeight);
    const ratio = landscapeWidth / 263;
    const positions = [
      [Math.round(x + 75 * ratio), Math.round(y + 94 * ratio)],
      [Math.round(x + 166 * ratio), Math.round(y + 124 * ratio)],
      [Math.round(x + 240 * ratio), Math.round(y + 91 * ratio)],
    ];
    state.actors.forEach((actor, index) => {
      [actor.x, actor.y] = positions[index];
      if (actor.visible) contexts.get(actor.layer).drawImage(sprites[actor.sprite], actor.x, actor.y);
    });
    stage.dataset.ready = 'true';
  }
  // ResizeObserver handles orientation and browser chrome changes; there is no
  // requestAnimationFrame, interval, or timer driving the scene.
  new ResizeObserver(render).observe(stage);
  loadSceneSprites().then(loaded => { sprites = loaded; render(); }).catch(() => {
    stage.dataset.ready = 'error'; // Navigation remains fully usable without art.
  });
  render();
}
```

## assets/js/scene-sprites.js

```javascript
/** Immutable sprite definitions. Each frame is its own transparent pixel asset.
 * A future animation controller can change frame/position without changing art.
 */
export const SCENE_SPRITES = Object.freeze({
  landscape: Object.freeze({ path: '/assets/images/pixel/landscape.png', width: 263, height: 168 }),
  bird: Object.freeze({ path: '/assets/images/pixel/bird.png', width: 18, height: 16 }),
  butterfly: Object.freeze({
    width: 9, height: 8,
    pixels: Object.freeze(['000000000','110000011','111010111','011111110','001111100','011010110','010010010','000000000']),
  }),
});

export async function loadSceneSprites() {
  const entries = await Promise.all(Object.entries(SCENE_SPRITES).map(async ([name, definition]) => {
    if (definition.path) {
      const image = new Image();
      image.src = definition.path;
      await image.decode();
      return [name, image];
    }
    const canvas = document.createElement('canvas');
    canvas.width = definition.width;
    canvas.height = definition.height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    definition.pixels.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === '1') context.fillRect(x, y, 1, 1);
    }));
    return [name, canvas];
  }));
  return Object.fromEntries(entries);
}
```

## portfolio/index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="A space for creator collaborations, operational growth, and approved testimonials.">
  <title>Creator portfolio — Free Market Wildlife</title>
  <link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="module" src="/assets/js/app.js?v=2"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="64" height="64" alt=""><span>FREE MARKET<br>WILDLIFE</span></a>
  <nav aria-label="Primary"><a href="/portfolio/" aria-current="page">Portfolio</a><a href="/tanoshi/">Tanoshi</a><a href="/contact/">Contact</a></nav>
  <button class="access-button" type="button" data-open-access aria-label="Sign in"><span>Sign in</span></button>
</header>
<main class="page-main" id="main" tabindex="-1">
  <div class="page-heading"><div><span class="eyebrow">01 / COLLABORATIONS</span><h1>Good work.<br><span class="muted">Shared momentum.</span></h1></div><p>Clearer processes. More intentional content. More room for the people doing the creating.</p></div>
  <div class="section-rule"><h2>Creator spotlight</h2><span class="badge">SHOWCASE IN PREPARATION</span></div>
  <p class="editorial-note">These are workspace previews. Project results and creator testimonials will be published only after approval.</p>
  <section class="creator-row panel" aria-labelledby="troy-title"><div class="creator-visual troy-visual"><span class="eyebrow">CONTENT STRATEGY / ANALYTICS</span><span class="creator-monogram" aria-hidden="true">TK<span>↗</span></span><span class="micro">WORKSPACE PREVIEW</span></div><div class="creator-story"><span class="eyebrow">CREATOR / 01</span><h2 id="troy-title">Troy Kearns</h2><p>A dedicated space to connect video performance with practical lessons for the next upload.</p><blockquote><p>Approved creator testimonial coming soon.</p><footer>Testimonial placeholder · no quotation supplied</footer></blockquote><div class="tag-row"><span>Video analysis</span><span>Content direction</span></div><button class="text-button" type="button" data-open-access aria-label="Sign in">Client workspace <span aria-hidden="true">↗</span></button></div></section>
  <section class="creator-row reverse panel" aria-labelledby="kat-title"><div class="creator-visual kat-visual"><span class="eyebrow">COMMUNITY / CREATOR SYSTEMS</span><span class="creator-monogram" aria-hidden="true">K<span>&</span>K</span><span class="micro">WORKSPACE PREVIEW</span></div><div class="creator-story"><span class="eyebrow">CREATOR / 02</span><h2 id="kat-title">Kat & Kai</h2><p>A focused roadmap from niche development to partnerships, community, and cross-platform content.</p><blockquote><p>Approved creator testimonial coming soon.</p><footer>Testimonial placeholder · no quotation supplied</footer></blockquote><div class="tag-row"><span>Creator roadmap</span><span>Community strategy</span></div><button class="text-button" type="button" data-open-access aria-label="Sign in">Client workspace <span aria-hidden="true">↗</span></button></div></section>
  <a class="bottom-cta panel" href="/contact/"><div><span class="eyebrow">THE NEXT COLLABORATION</span><h2>Let’s build your momentum.</h2></div><span class="round-arrow">↗</span></a>
</main>
<footer class="site-footer"><span>INDEPENDENT THINKING. INTENTIONAL GROWTH.</span><span>© <span data-year>2026</span> FREE MARKET WILDLIFE</span></footer>
<dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title">
  <div class="dialog-panel">
    <button class="close-button" type="button" data-close-access aria-label="Close client access">×</button>
    <span class="eyebrow">CLIENT WORKSPACE</span>
    <div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div>
    <h2 id="access-title">Sign in.</h2>
    <p class="muted">Enter your workspace password to continue.</p>
    <form data-access-form>
      <label for="access-code">Password</label>
      <input id="access-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="access-error" placeholder="Enter password">
      <p class="form-error" id="access-error" aria-live="polite"></p>
      <button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="micro">Temporary preview access. Public content only.</p>
  </div>
</dialog>
</body>
</html>
```

## tanoshi/index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="A creative studio for moving images, original sound, and imagined worlds.">
  <title>Tanoshi — Free Market Wildlife</title>
  <link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="module" src="/assets/js/app.js?v=2"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="64" height="64" alt=""><span>FREE MARKET<br>WILDLIFE</span></a>
  <nav aria-label="Primary"><a href="/portfolio/">Portfolio</a><a href="/tanoshi/" aria-current="page">Tanoshi</a><a href="/contact/">Contact</a></nav>
  <button class="access-button" type="button" data-open-access aria-label="Sign in"><span>Sign in</span></button>
</header>
<main class="page-main" id="main" tabindex="-1">
  <div class="page-heading"><div><span class="eyebrow">02 / THE CREATIVE PRACTICE</span><h1>Tanoshi<span class="accent">.</span><br><span class="muted">A little less ordinary.</span></h1></div><p>Moving images. Original sound. Imagined worlds. A home for work made with curiosity.</p></div>
  <div class="section-rule"><h2>Inside the studio</h2><span class="badge">CATALOG IN PREPARATION</span></div>
  <div class="studio-grid">
    <section class="panel film-module"><div class="module-heading"><span class="eyebrow">01 / MOTION & STORY</span><span class="micro">VIDEO</span></div><div class="video-wrapper"><video preload="none" poster="/assets/images/studio-poster.svg" aria-label="Showreel placeholder; no video source has been added"></video><span class="media-note">SHOWREEL PLACEHOLDER · MEDIA COMING SOON</span></div><div class="module-copy"><h2>Stories in motion.</h2><p>A space for films, edits, and visual experiments. Add an approved showreel to bring this frame to life.</p><a class="text-button" href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">Explore YouTube <span aria-hidden="true">↗</span></a><span class="micro muted">Platform link · creator channel to be added</span></div></section>
    <section class="panel audio-module"><div class="module-heading"><span class="eyebrow">02 / SOUND & MUSIC</span><span class="micro">AUDIO</span></div><div class="record-art" aria-hidden="true"><div><span>T<br>001</span></div></div><div class="module-copy"><span class="eyebrow">LISTENING ROOM</span><h2>Let it resonate.</h2><p>Original music and audio work. This player is ready for the first approved track.</p><div class="audio-placeholder" role="img" aria-label="Audio player placeholder; no track has been added"><span aria-hidden="true">▸</span> No audio uploaded</div><span class="micro muted">NO AUDIO UPLOADED</span><a class="text-button" href="https://soundcloud.com/" target="_blank" rel="noopener noreferrer">Explore SoundCloud <span aria-hidden="true">↗</span></a><span class="micro muted">Platform link · artist profile to be added</span></div></section>
    <section class="panel worlds-module"><div><span class="eyebrow">03 / WORLDS & EXPERIMENTS</span><h2>Follow the curiosity.</h2><p>Room for original projects, interactive ideas, and the things that don’t fit neatly into a category.</p><span class="badge">PROJECT ASSETS COMING SOON</span></div><div class="world-art" aria-hidden="true">✳</div></section>
    <a class="panel studio-contact" href="/contact/"><span class="eyebrow">HAVE SOMETHING IN MIND?</span><h2>Make something<br>that matters.</h2><span class="card-link">Start a conversation <span aria-hidden="true">↗</span></span></a>
  </div>
</main>
<footer class="site-footer"><span>INDEPENDENT THINKING. INTENTIONAL GROWTH.</span><span>© <span data-year>2026</span> FREE MARKET WILDLIFE</span></footer>
<dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title">
  <div class="dialog-panel">
    <button class="close-button" type="button" data-close-access aria-label="Close client access">×</button>
    <span class="eyebrow">CLIENT WORKSPACE</span>
    <div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div>
    <h2 id="access-title">Sign in.</h2>
    <p class="muted">Enter your workspace password to continue.</p>
    <form data-access-form>
      <label for="access-code">Password</label>
      <input id="access-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="access-error" placeholder="Enter password">
      <p class="form-error" id="access-error" aria-live="polite"></p>
      <button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="micro">Temporary preview access. Public content only.</p>
  </div>
</dialog>
</body>
</html>
```

## contact/index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="Start a conversation with Free Market Wildlife at FreeMarketWildlife@gmail.com.">
  <title>Contact — Free Market Wildlife</title>
  <link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="module" src="/assets/js/app.js?v=2"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="64" height="64" alt=""><span>FREE MARKET<br>WILDLIFE</span></a>
  <nav aria-label="Primary"><a href="/portfolio/">Portfolio</a><a href="/tanoshi/">Tanoshi</a><a href="/contact/" aria-current="page">Contact</a></nav>
  <button class="access-button" type="button" data-open-access aria-label="Sign in"><span>Sign in</span></button>
</header>
<main class="page-main contact-main" id="main" tabindex="-1">
  <div class="page-heading"><div><span class="eyebrow">03 / START A CONVERSATION</span><h1>Big idea?<br><span class="accent">Let’s hear it.</span></h1></div><p>A creative challenge, a clearer direction, or a better way of working. Tell us what’s on your mind.</p></div>
  <div class="contact-grid"><aside class="panel contact-details"><span class="eyebrow">THE DIRECT LINE</span><h2>Good things start<br>with a hello.</h2><p>For consulting, creative collaborations, and everything in between.</p><a class="email-link" href="mailto:FreeMarketWildlife@gmail.com">FreeMarketWildlife@gmail.com <span aria-hidden="true">↗</span></a><button class="text-button" type="button" data-copy-email>Copy email address <span aria-hidden="true">⧉</span></button><p class="micro" data-copy-status role="status"></p><div class="contact-note"><span class="status-dot"></span><p>One inbox.<br>A thoughtful place to begin.</p></div></aside>
  <section class="panel contact-form-panel" aria-labelledby="form-title"><span class="eyebrow">A NOTE TO FREE MARKET WILDLIFE</span><h2 id="form-title">Tell us a little more.</h2><form id="contact-form"><div class="form-row"><div><label for="name">Name</label><input id="name" name="name" autocomplete="name" maxlength="120" required placeholder="Your name"></div><div><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></div></div><label for="message">Message</label><textarea id="message" name="message" rows="6" maxlength="5000" required placeholder="What are you working toward?"></textarea><p class="form-help" id="contact-help">This opens a prepared email in your mail app. Review it there and send when you’re ready.</p><button class="button primary" type="submit" aria-describedby="contact-help">Submit via email <span aria-hidden="true">↗</span></button><p class="form-status" id="contact-status" role="status"></p></form></section></div>
</main>
<footer class="site-footer"><span>INDEPENDENT THINKING. INTENTIONAL GROWTH.</span><span>© <span data-year>2026</span> FREE MARKET WILDLIFE</span></footer>
<dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title">
  <div class="dialog-panel">
    <button class="close-button" type="button" data-close-access aria-label="Close client access">×</button>
    <span class="eyebrow">CLIENT WORKSPACE</span>
    <div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div>
    <h2 id="access-title">Sign in.</h2>
    <p class="muted">Enter your workspace password to continue.</p>
    <form data-access-form>
      <label for="access-code">Password</label>
      <input id="access-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="access-error" placeholder="Enter password">
      <p class="form-error" id="access-error" aria-live="polite"></p>
      <button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="micro">Temporary preview access. Public content only.</p>
  </div>
</dialog>
</body>
</html>
```

## troy-kearns/index.html

```html
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#000000"><meta name="robots" content="noindex, nofollow">
<title>Links — Troy Kearns</title>
<link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/troy.css?v=3">
<script type="module" src="/assets/js/app.js?v=2"></script>
</head><body data-client="troy-kearns">
<div id="workspace-content" hidden inert>
<header><a href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="40" height="40" alt="Free Market Wildlife"></a><nav aria-label="Troy workspace"><a href="/troykearns/" aria-current="page">Links</a><a href="/troykearns/statistics/">Statistics</a></nav><button type="button" data-lock-workspace>Sign out</button></header>
<main id="main" tabindex="-1"><h1>Links:</h1><ul>
<li>YouTube: <a href="https://www.youtube.com/troykearns" target="_blank" rel="noopener noreferrer">youtube.com/troykearns</a></li>
<li>Instagram: <a href="https://www.instagram.com/thetroykearns/" target="_blank" rel="noopener noreferrer">@thetroykearns</a></li>
<li>TikTok: <a href="https://www.tiktok.com/@thetroykearns" target="_blank" rel="noopener noreferrer">@thetroykearns</a></li>
<li>Facebook community: <a href="https://www.facebook.com/groups/374488864645587/" target="_blank" rel="noopener noreferrer">facebook.com/groups/374488864645587</a></li>
<li>Podcast: <a href="https://open.spotify.com/show/0HJPBOWnR9TzVajjKEaS2w" target="_blank" rel="noopener noreferrer">Millionaire Mentorship</a></li>
<li>Coaching: <a href="https://takeaction.troykearns.com/work-with-us-3" target="_blank" rel="noopener noreferrer">takeaction.troykearns.com/work-with-us-3</a></li>
<li>Book: <a href="https://www.amazon.com/MILLIONAIRE-MENTORSHIP-ESTATE-STARTING-SCRATCH/dp/0578390965" target="_blank" rel="noopener noreferrer">Millionaire Mentorship on Amazon</a></li>
<li>Email: <a href="mailto:tk@troykearns.com">tk@troykearns.com</a></li>
</ul></main>
</div>
<dialog class="gate-dialog tk-gate" id="workspace-gate" open aria-labelledby="gate-title"><div class="gate-shell"><a class="brand" href="/"><img src="/assets/images/mark.svg" width="40" height="40" alt=""><span>FREE MARKET<br>WILDLIFE</span></a><div class="dialog-panel"><span class="eyebrow">TROY KEARNS / WORKSPACE</span><h2 id="gate-title">Sign in.</h2><p>Good to have you here.</p><form data-gate-form><label for="gate-code">Password</label><input id="gate-code" name="passcode" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" required aria-describedby="gate-error" autofocus><p class="form-error" id="gate-error" aria-live="polite"></p><button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button></form><p class="micro">Temporary preview access. Public content only.</p><a class="text-button" href="/">← Back home</a><noscript><p>Enable JavaScript to use this preview.</p></noscript></div><span class="micro">FREE MARKET WILDLIFE</span></div></dialog>

</body></html>
```

## troykearns/index.html

```html
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#000000"><meta name="robots" content="noindex, nofollow">
<title>Links — Troy Kearns</title>
<link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/troy.css?v=3">
<script type="module" src="/assets/js/app.js?v=2"></script>
</head><body data-client="troy-kearns">
<div id="workspace-content" hidden inert>
<header><a href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="40" height="40" alt="Free Market Wildlife"></a><nav aria-label="Troy workspace"><a href="/troykearns/" aria-current="page">Links</a><a href="/troykearns/statistics/">Statistics</a></nav><button type="button" data-lock-workspace>Sign out</button></header>
<main id="main" tabindex="-1"><h1>Links:</h1><ul>
<li>YouTube: <a href="https://www.youtube.com/troykearns" target="_blank" rel="noopener noreferrer">youtube.com/troykearns</a></li>
<li>Instagram: <a href="https://www.instagram.com/thetroykearns/" target="_blank" rel="noopener noreferrer">@thetroykearns</a></li>
<li>TikTok: <a href="https://www.tiktok.com/@thetroykearns" target="_blank" rel="noopener noreferrer">@thetroykearns</a></li>
<li>Facebook community: <a href="https://www.facebook.com/groups/374488864645587/" target="_blank" rel="noopener noreferrer">facebook.com/groups/374488864645587</a></li>
<li>Podcast: <a href="https://open.spotify.com/show/0HJPBOWnR9TzVajjKEaS2w" target="_blank" rel="noopener noreferrer">Millionaire Mentorship</a></li>
<li>Coaching: <a href="https://takeaction.troykearns.com/work-with-us-3" target="_blank" rel="noopener noreferrer">takeaction.troykearns.com/work-with-us-3</a></li>
<li>Book: <a href="https://www.amazon.com/MILLIONAIRE-MENTORSHIP-ESTATE-STARTING-SCRATCH/dp/0578390965" target="_blank" rel="noopener noreferrer">Millionaire Mentorship on Amazon</a></li>
<li>Email: <a href="mailto:tk@troykearns.com">tk@troykearns.com</a></li>
</ul></main>
</div>
<dialog class="gate-dialog tk-gate" id="workspace-gate" open aria-labelledby="gate-title"><div class="gate-shell"><a class="brand" href="/"><img src="/assets/images/mark.svg" width="40" height="40" alt=""><span>FREE MARKET<br>WILDLIFE</span></a><div class="dialog-panel"><span class="eyebrow">TROY KEARNS / WORKSPACE</span><h2 id="gate-title">Sign in.</h2><p>Good to have you here.</p><form data-gate-form><label for="gate-code">Password</label><input id="gate-code" name="passcode" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" required aria-describedby="gate-error" autofocus><p class="form-error" id="gate-error" aria-live="polite"></p><button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button></form><p class="micro">Temporary preview access. Public content only.</p><a class="text-button" href="/">← Back home</a><noscript><p>Enable JavaScript to use this preview.</p></noscript></div><span class="micro">FREE MARKET WILDLIFE</span></div></dialog>

</body></html>
```

## troykearns/statistics/index.html

```html
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#000000"><meta name="robots" content="noindex, nofollow">
<title>Statistics — Troy Kearns</title>
<link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/troy.css?v=3">
<script type="module" src="/assets/js/app.js?v=2"></script>
</head><body data-client="troy-kearns">
<div id="workspace-content" hidden inert>
<header><a href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="40" height="40" alt="Free Market Wildlife"></a><nav aria-label="Troy workspace"><a href="/troykearns/">Links</a><a href="/troykearns/statistics/" aria-current="page">Statistics</a></nav><button type="button" data-lock-workspace>Sign out</button></header>
<main id="main" tabindex="-1"><h1>Statistics</h1><p>The spreadsheet will go here.</p></main>
</div>
<dialog class="gate-dialog tk-gate" id="workspace-gate" open aria-labelledby="gate-title"><div class="gate-shell"><a class="brand" href="/"><img src="/assets/images/mark.svg" width="40" height="40" alt=""><span>FREE MARKET<br>WILDLIFE</span></a><div class="dialog-panel"><span class="eyebrow">TROY KEARNS / WORKSPACE</span><h2 id="gate-title">Sign in.</h2><p>Good to have you here.</p><form data-gate-form><label for="gate-code">Password</label><input id="gate-code" name="passcode" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" required aria-describedby="gate-error" autofocus><p class="form-error" id="gate-error" aria-live="polite"></p><button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button></form><p class="micro">Temporary preview access. Public content only.</p><a class="text-button" href="/">← Back home</a><noscript><p>Enable JavaScript to use this preview.</p></noscript></div><span class="micro">FREE MARKET WILDLIFE</span></div></dialog>

</body></html>
```

## kat-kai/index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="Free Market Wildlife client workspace. Public demonstration content; passcode access is a convenience barrier.">
  <title>Kat &amp; Kai workspace — Free Market Wildlife</title>
  <link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="module" src="/assets/js/app.js?v=2"></script>
</head>
<body class="workspace-page" data-client="kat-kai">
  <div id="workspace-content" hidden inert>
  <a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="64" height="64" alt=""><span>FREE MARKET<br>WILDLIFE</span></a>
  <nav aria-label="Primary"><a href="/portfolio/">Portfolio</a><a href="/tanoshi/">Tanoshi</a><a href="/contact/">Contact</a></nav>
  <button class="access-button" type="button" data-open-access aria-label="Sign in"><span>Sign in</span></button>
</header>
  <main class="page-main" id="main" tabindex="-1"><div class="workspace-bar"><a href="/">← Back to Free Market Wildlife</a><div><span class="badge unlocked"><span class="status-dot"></span> WORKSPACE UNLOCKED</span><button class="text-button" type="button" data-lock-workspace>Lock workspace <img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></button></div></div>
  <div class="page-heading"><div><span class="eyebrow">CLIENT WORKSPACE / K&K</span><h1>Kat &amp; Kai<span class="accent">.</span></h1></div><p>A shared place for clear priorities<br>and the next meaningful move.</p></div>
  <p class="editorial-note">Foundation preview · Demonstration structure only. No private client information or verified performance data is stored here.</p>
  <section class="panel roadmap-intro"><div><span class="eyebrow">THE LONG GAME</span><h2>Road to <span class="accent">10,000</span><br>Subscribers</h2><p>Four intentional phases. One connected creator journey.</p></div><div class="target-mark" aria-hidden="true"><span>10<span>K</span></span></div><div class="roadmap-meta"><span class="micro">CURRENT SUBSCRIBERS</span><strong>Not connected</strong><span class="micro muted">Milestone progress will follow verified channel data.</span></div></section>
<div class="section-rule"><h2>The growth roadmap</h2><span class="micro muted">PROPOSED PLAN / COMPLETION NOT YET RECORDED</span></div><ol class="timeline"><li class="timeline-item"><span class="phase-number" aria-hidden="true">01</span><section class="panel phase-card"><div class="card-top"><span class="eyebrow">PHASE 1</span><span class="badge">PLANNING</span></div><h3>Active Niche Solidification</h3><p>Build a recognizable reason to subscribe.</p><ul class="phase-tasks"><li>Clarify the audience and core content promise.</li><li>Define repeatable formats and review audience signals.</li></ul><div class="phase-outcome"><span class="micro">MILESTONE TO UNLOCK</span><p>A clear niche and a sustainable publishing direction.</p></div></section></li><li class="timeline-item"><span class="phase-number" aria-hidden="true">02</span><section class="panel phase-card"><div class="card-top"><span class="eyebrow">PHASE 2</span><span class="badge">UPCOMING</span></div><h3>Sponsorship and Brand Alignment Sourcing</h3><p>Find partnerships that belong in the story.</p><ul class="phase-tasks"><li>Map aligned brand categories and partnership criteria.</li><li>Prepare a media kit using verified channel analytics.</li></ul><div class="phase-outcome"><span class="micro">MILESTONE TO UNLOCK</span><p>An approved outreach shortlist and sponsorship positioning.</p></div></section></li><li class="timeline-item"><span class="phase-number" aria-hidden="true">03</span><section class="panel phase-card"><div class="card-top"><span class="eyebrow">PHASE 3</span><span class="badge">UPCOMING</span></div><h3>10k Subscriber Discord Community Scaling</h3><p>Give the community a place to connect.</p><ul class="phase-tasks"><li>Plan channel structure, community guidelines, and moderation.</li><li>Define launch readiness around the 10k subscriber milestone.</li></ul><div class="phase-outcome"><span class="micro">MILESTONE TO UNLOCK</span><p>A community launch plan with clear ownership and capacity.</p></div></section></li><li class="timeline-item"><span class="phase-number" aria-hidden="true">04</span><section class="panel phase-card"><div class="card-top"><span class="eyebrow">PHASE 4</span><span class="badge">UPCOMING</span></div><h3>Cross-Platform Content Repurposing Funnels</h3><p>Let good stories travel further.</p><ul class="phase-tasks"><li>Map each long-form story into platform-native cuts.</li><li>Define a repeatable path back to the primary channel.</li></ul><div class="phase-outcome"><span class="micro">MILESTONE TO UNLOCK</span><p>A sustainable repurposing workflow and measurable referral path.</p></div></section></li></ol>
  </main><footer class="site-footer"><span>INDEPENDENT THINKING. INTENTIONAL GROWTH.</span><span>© <span data-year>2026</span> FREE MARKET WILDLIFE</span></footer></div>
  <dialog class="gate-dialog" id="workspace-gate" open aria-labelledby="gate-title"><div class="gate-shell"><a class="brand" href="/"><img src="/assets/images/mark.svg" width="64" height="64" alt=""><span>FREE MARKET<br>WILDLIFE.</span></a><div class="dialog-panel"><span class="eyebrow">K&K / CLIENT WORKSPACE</span><div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div><h2 id="gate-title">A little focus.<br>A lot of possibility.</h2><p class="muted">Enter the passcode for Kat &amp; Kai to open this workspace.</p><form data-gate-form><label for="gate-code">Password</label><input id="gate-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Enter password" required aria-describedby="gate-error" autofocus><p class="form-error" id="gate-error" aria-live="polite"></p><button class="button primary" type="submit">Unlock workspace <span aria-hidden="true">→</span></button></form><p class="micro">This static passcode is an interface barrier. Files on this public website are not confidential.</p><a class="text-button" href="/">← Return home</a><noscript><p class="form-error">Enable JavaScript to use passcode access.</p></noscript></div><span class="micro muted">FREE MARKET WILDLIFE / CLEAR DIRECTION</span></div></dialog>
  <dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title">
  <div class="dialog-panel">
    <button class="close-button" type="button" data-close-access aria-label="Close client access">×</button>
    <span class="eyebrow">CLIENT WORKSPACE</span>
    <div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div>
    <h2 id="access-title">Sign in.</h2>
    <p class="muted">Enter your workspace password to continue.</p>
    <form data-access-form>
      <label for="access-code">Password</label>
      <input id="access-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="access-error" placeholder="Enter password">
      <p class="form-error" id="access-error" aria-live="polite"></p>
      <button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="micro">Temporary preview access. Public content only.</p>
  </div>
</dialog>
</body>
</html>
```

## 404.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="description" content="This path is not part of the Free Market Wildlife website.">
  <title>Page not found — Free Market Wildlife</title>
  <link rel="icon" href="/assets/images/mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/styles.css">
  <script type="module" src="/assets/js/app.js?v=2"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Free Market Wildlife home"><img src="/assets/images/mark.svg" width="64" height="64" alt=""><span>FREE MARKET<br>WILDLIFE</span></a>
  <nav aria-label="Primary"><a href="/portfolio/">Portfolio</a><a href="/tanoshi/">Tanoshi</a><a href="/contact/">Contact</a></nav>
  <button class="access-button" type="button" data-open-access aria-label="Sign in"><span>Sign in</span></button>
</header>
<main class="page-main not-found" id="main" tabindex="-1"><span class="eyebrow">404 / A DIFFERENT PATH</span><h1>Let’s find<br>your next move.</h1><p class="muted">This page doesn’t exist. Head home or enter your client passcode.</p><a class="button primary" href="/">Back to home <span aria-hidden="true">→</span></a></main>
<footer class="site-footer"><span>INDEPENDENT THINKING. INTENTIONAL GROWTH.</span><span>© <span data-year>2026</span> FREE MARKET WILDLIFE</span></footer>
<dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title">
  <div class="dialog-panel">
    <button class="close-button" type="button" data-close-access aria-label="Close client access">×</button>
    <span class="eyebrow">CLIENT WORKSPACE</span>
    <div class="lock-emblem"><img class="pixel-lock" src="/assets/images/lock.svg" width="24" height="28" alt=""></div>
    <h2 id="access-title">Sign in.</h2>
    <p class="muted">Enter your workspace password to continue.</p>
    <form data-access-form>
      <label for="access-code">Password</label>
      <input id="access-code" name="passcode" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="access-error" placeholder="Enter password">
      <p class="form-error" id="access-error" aria-live="polite"></p>
      <button class="button primary" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="micro">Temporary preview access. Public content only.</p>
  </div>
</dialog>
</body>
</html>
```

## .github/workflows/pages.yml

```yaml
name: Deploy static site to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate static source
        run: python3 scripts/check_site.py
      - uses: actions/configure-pages@v5
      - name: Prepare public files
        run: |
          mkdir _site
          cp index.html 404.html CNAME .nojekyll _site/
          cp -R assets portfolio tanoshi contact troy-kearns troykearns kat-kai _site/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

## CNAME

```text
freemarketwildlife.com
```
