# Local verification — October 17, 2026

## Automated source checks

`python3 scripts/check_site.py` passed for all seven HTML pages, assets and font references, unique IDs, initial hidden/inert workspace barriers, client-route structure, exact naming, monochrome CSS/SVG colors, PNG dimensions/checksums/1-bit encoding/transparency, and absence of active scene animation.

The bundled JavaScript runtime's syntax check passed for `app.js`, `scene.js`, and `scene-sprites.js`. That runtime is only a developer check; the website does not require Node.js.

An independent read-only Pillow inspection found exactly these RGBA entries in both production sprites:

- `(0, 0, 0, 0)` — transparent.
- `(255, 255, 255, 255)` — white.

## Actual browser checks

The local site was served over HTTP and checked in the desktop in-app browser. These are viewport simulations, not physical-device certification.

| Homepage viewport | Logical pixel size | Document matches viewport | All navigation and access controls fit | Scene ready |
| --- | --- | --- | --- | --- |
| 1920 × 1080 | 3px | Pass | Pass | Pass |
| 1440 × 800 | 3px | Pass | Pass | Pass |
| 1024 × 768 | 2px | Pass | Pass | Pass |
| 390 × 780 | 2px | Pass | Pass | Pass |
| 320 × 568 | 2px | Pass | Pass | Pass |
| 844 × 390 | 2px | Pass | Pass | Pass |

- Pointer hover: Portfolio's arrow became visible while the other two remained hidden.
- Keyboard: moving focus to Tanoshi transferred the visible arrow to that link.
- Public inner pages: Portfolio, Tanoshi, and Contact had 390px document widths at a 390px viewport. Computed colors on visible text, backgrounds, and borders were only black, white, and transparent.
- Client launcher: invalid input produced a live error and `aria-invalid`; Troy's valid code routed to `/troy-kearns/`.
- Troy gate: valid code opened the six-column table. Reload restored the barrier.
- Kat & Kai gate: Troy's code was rejected. Escape did not dismiss the gate. The correct code revealed all four requested phases, with no horizontal overflow at 390px.
- Contact: an invalid email produced `validity.typeMismatch`; no telephone fields or backend form action existed. No email was sent or external form service contacted during validation.
- No browser console errors were recorded during final checks.

## Saved visual review

- `homepage-desktop.jpg` — complete homepage at the normal 1280 × 720 preview viewport.
- `homepage-mobile.jpg` — complete homepage at 390 × 780.
- `portfolio-mobile.jpg`, `tanoshi-mobile.jpg`, `contact-mobile.jpg` — initial inner-page views at 390 × 780.

Browser captures are JPEGs, so their compression can introduce gray edge pixels. The production asset palette and authored CSS/SVG colors were verified independently above.

## External state

No remote Git repository, GitHub Pages publishing setting, DNS record, or domain certificate was changed. No public deployment is claimed. Browser layout overrides were reset, and the local homepage was left open for review.

## Homepage refinement

The supplied handheld-screen emblem was directly isolated into a white/transparent pixel mask, without a generative redraw. The homepage displays that copied emblem at 24 × 24 CSS pixels. Navigation is now Build a Career (the existing contact portal), Portfolio, and Tanoshi. The arrow is aligned to the text line rather than the full hit area, which keeps its point centered at every breakpoint. The existing top-right sign-in flow was preserved; lock icons were removed from top-right sign-in controls. Browser inspection confirmed the 24px logo, three updated labels, and zero images inside the homepage sign-in button. Source checks passed for all eight current pages.
