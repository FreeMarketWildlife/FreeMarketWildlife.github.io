# Browser arcade

Public route: `/portfolio/critz/games/`. All twelve included games are labeled playable prototypes. Each has a launch page, direct standalone fallback, browser fullscreen by user gesture, explicit viewport expansion, exit and reload controls, and game-specific input instructions. Keyboard-only games are labeled desktop. Browser viewport expansion does not promise iPhone native fullscreen.

The arcade packages only selected runtime files from existing public game projects. Treetop uses the already published v13 gameplay release. Tycoon uses the retained Sites gameplay baseline; its separately pending sprite-editor release is excluded. Existing original-site saves are not migrated or overwritten. The arcade runs under the Free Market Wildlife origin with the original save keys; original hosted games retain their separate origin storage.

| Route | Existing playable slice |
| --- | --- |
| `treetop-trebuchet/` | Treetop Trebuchet launcher and upgrades |
| `tycoon/` | Rootport Stories ecosystem RPG chapter |
| `baad-math/` | Endless sheep counting survival |
| `tower-defense/` | Buttonwood / Tower of Babel building sandbox |
| `kingdom-conquest/` | Conqueror lane battle with 18 animated 3D animal minions |
| `ctrl-alt-del/` | Episode I drawn-cel campaign prototype |
| `serpent-siege/` | Mouse versus the endless snake |
| `battlefront/` | Early geometric Battlefront shooter experiment |
| `runner/` | Runner minigame, with held touch buttons |
| `katana-mouse/` | Arena combat minigame |
| `critter-quest/` | Choice-based hero adventure minigame |
| `card-game/` | Existing 93-card strategy prototype |

Remaining documented standalone concepts have no discovered runnable implementation; no placeholder is presented as playable. Sky Stack, Tower of Babel and Buttonwood are one evolving game, not three titles. The lore globe and asset-authoring tools are not game releases.

Production uses the existing `fmw-workspaces` Worker; pushing GitHub alone does not update it. No Worker routing, authentication, access policy, database, bucket, secret or membership changes are part of this change. The existing public Pages allowlist already includes `portfolio/`.

Validation: `node tests/test_arcade.mjs`, `python3 scripts/check_site.py`, existing workspace-auth tests, Worker dry-run, and browser launch/input checks. Browser size checks use desktop and 390×844 viewports; physical iOS/Android hardware is not certified. Matter.js, Three.js and Planck licenses are included beside their vendored runtimes. The brief Matter.js delta recommendation remains an upstream runtime warning.

Kingdom Conquest uses the independently tested all-18-minion static release from source commit `213f37c786815692b023aa103815c42669722f8b`, with the archive SHA-256 verified before extraction and all 34 manifest-listed runtime files checked byte-for-byte. The existing map, canvas Conquerors and simulation are preserved. All 18 animated GLBs and pinned Three.js runtime are included; no model generation sources, paid services or credentials are included. WebGL enables the 3D layer; the supplied simplified canvas fallback remains available. Movement requires desktop mouse/keyboard; touch controls cover menus and abilities.

The default Kingdom Conquest entry now uses the verified Lincoln (gorilla) / Theodore (opossum) playable demo from source `3eef56fb4442ce1a7674fcb5687bd706394cbff1`. Both use their existing rigs against the other AI Conqueror; eighteen minion species remain. Temporary demo abilities are labeled as such. The previous Vesper battlefield remains at `builds/kingdom-conquest/classic.html`, reachable from the individual player page. The thumbnail-only catalog is unchanged. The release archive SHA-256 and all 39 manifest file hashes were verified before integration; no source model edits, generation or paid services were needed.
