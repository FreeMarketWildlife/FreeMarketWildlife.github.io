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
