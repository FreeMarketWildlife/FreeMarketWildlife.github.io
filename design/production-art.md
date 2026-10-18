# Production pixel art

The approved starting point is `concepts/01-the-clearing.png`, originally generated with the built-in imagegen tool. Its full generation prompt is retained in `concepts/README.md`. This reference is not shipped as the website background.

The two additional transparent extraction attempts generated during implementation did not preserve the approved tree's negative spaces closely enough. They were not used. Production sprites preserve the approved concept through the deterministic browser renderer in `scripts/prepare_sprites.html`: scenery is sampled on a fixed grid, website lettering and the perched bird are removed from that layer, the bird is isolated separately, and the resulting pixels are classified as opaque white or fully transparent. The prepared scanlines are retained in `scripts/pixel-masks.json` and packaged as real 1-bit PNGs.

Final production files:

- `assets/images/pixel/landscape.png`: 263 × 168, white + transparency.
- `assets/images/pixel/bird.png`: 18 × 16, white + transparency.
- `assets/js/scene-sprites.js`: separate 9 × 8 butterfly mask.
- `assets/images/mark.svg`: direct pixel-mask extraction of the supplied logo from `design/references/logo-exact-source.png`, preserving the source silhouette and converting its ink to white with a transparent background. `scripts/extract_supplied_logo.py` documents the exact extraction.
- `assets/images/arrow.svg` and `lock.svg`: code-native integer-grid icons.

The logo reference images are retained under `design/references/`. These colored references and old concept images are excluded from the deployment artifact. All production artwork is black, white, or transparent.

The website is currently static. Scene drawing happens only on asset load and viewport resize. Future flight paths and wing frames should be added through a separate controller, preserving the source palette, snapped sprite positions, semantic DOM controls, and motion preferences.

## Shared website art bible

- Keep the main website on one coherent pixel grid and visual style. Use integer coordinates and whole-number scaling for sprites and icons; match the existing two/three CSS-pixel logical grid rather than mixing arbitrary pixel sizes.
- Production art is black and white, with transparency. Use grid-aligned black/white dithering for shading, never gradients or gray painted pixels. Preserve crisp stepped silhouettes; no smooth vector curves, blur, or fractional icon scaling.
- Reuse the supplied emblem and existing arrow/lock icon language. Keep interaction controls semantic, keyboard accessible, and at least 44 CSS pixels tall for touch.
- Preserve established homepage lettering and its slab pixel typefaces. Long-form blog text may use a readable pixel font instead of hand-drawn per-letter artwork.
- Blog reading text and controls use Phil’s selected self-hosted, unmodified DotGothic16. Reading text is 16px / 32px line-height with a maximum 65ch measure; controls inherit the same family with at least 44px hit height. Established display headings and the homepage retain their existing fonts. Native font rasterization may antialias glyph edges; artwork remains binary. Source: https://github.com/google/fonts/tree/main/ofl/dotgothic16 ; license: assets/fonts/DotGothic16-OFL.txt (SIL Open Font License 1.1). No third-party font request is made by the site. Blog font settings are isolated in assets/css/blog.css.


## Blog content and sorting

Blog is the final homepage menu option and uses the existing static directory route `/blog/`. There are currently no published posts. Never invent articles, author statements, dates, or popularity counts. The native Sort control defaults to Newest and offers Oldest and Most popular. Future published HTML entries use a stable unique `data-post-id`, ISO `data-published-at`, and optional `data-popularity` only from a genuine documented source. Date ties use post ID; popularity ties use newest date then ID; missing popularity sorts after measured posts. Without popularity data the page explains the newest-first fallback. No tracking service, CMS, or credentials are introduced.
