# Browser arcade

Public route: `/portfolio/critz/games/`. All eleven included games are labeled playable prototypes. Each has a launch page, direct standalone fallback, browser fullscreen by user gesture, explicit viewport expansion, exit and reload controls, and game-specific input instructions. Keyboard-only games are labeled desktop. Browser viewport expansion does not promise iPhone native fullscreen.

The arcade packages only selected runtime files from existing public game projects. Treetop uses the already published v13 gameplay release. Tycoon uses the retained Sites gameplay baseline; its separately pending sprite-editor release is excluded. Existing original-site saves are not migrated or overwritten. The arcade runs under the Free Market Wildlife origin with the original save keys; original hosted games retain their separate origin storage.

| Route | Existing playable slice |
| --- | --- |
| `treetop-trebuchet/` | Treetop Trebuchet launcher and upgrades |
| `tycoon/` | Rootport Stories ecosystem RPG chapter |
| `baad-math/` | Endless sheep counting survival |
| `tower-defense/` | Buttonwood / Tower of Babel building sandbox |
| `ctrl-alt-del/` | Episode I drawn-cel campaign prototype |
| `serpent-siege/` | Mouse versus the endless snake |
| `battlefront/` | Early geometric Battlefront shooter experiment |
| `runner/` | Runner minigame, with held touch buttons |
| `katana-mouse/` | Arena combat minigame |
| `critter-quest/` | Choice-based hero adventure minigame |
| `card-game/` | Existing 93-card strategy prototype |

Kingdom Conquest is receiving an independent development update and awaits its tested release. Remaining documented standalone concepts have no discovered runnable implementation; no placeholder is presented as playable. Sky Stack, Tower of Babel and Buttonwood are one evolving game, not three titles. The lore globe and asset-authoring tools are not game releases.

Production uses the existing `fmw-workspaces` Worker; pushing GitHub alone does not update it. No Worker routing, authentication, access policy, database, bucket, secret or membership changes are part of this change. The existing public Pages allowlist already includes `portfolio/`.

Validation: `node tests/test_arcade.mjs`, `python3 scripts/check_site.py`, existing workspace-auth tests, Worker dry-run, and browser launch/input checks. Browser size checks use desktop and 390×844 viewports; physical iOS/Android hardware is not certified. Matter.js, Three.js and Planck licenses are included beside their vendored runtimes. The brief Matter.js delta recommendation remains an upstream runtime warning.
