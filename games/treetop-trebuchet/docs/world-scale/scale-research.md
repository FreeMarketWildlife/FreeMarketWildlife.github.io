# A proportioned Grimroot Grove · source and release checkpoint

21 October 2026. This report records source-level dimensions and tests; release state is in [the release checklist](release-readiness.md). No personal browser progress, currency, ownership or custom map has been changed to test it.

Open [the scale field guide](../../scale.html) from the local HTTP server. Its four comparison panels use the existing ready-pose animal artwork, actual nominal game envelopes and latched solver-fixture machines. Its fifth figure shows actual canonical map placements. The full searchable inventory contains **469 entries**: all 11 volunteers, all 14 encounter recipes, all four machine recipes, all 378 canonical map objects, 60 whole-tree comparisons, a leaf and the academy doorway. Each panel has one linear metre scale; panels have different labelled contexts/zooms. The separate in-game height strip intentionally compresses upper sky.

## Chosen physical dimensions and reference basis

| Feature | Authored metres | Basis / limits |
| --- | --- | --- |
| Grandfather oak | 110 tall; 7 basal trunk diameter; 76 crown span; 64 crown depth; about 9.8 root spread | [NPS coast-redwood reference](https://www.nps.gov/redw/learn/nature/about-the-trees.htm) describes trees to 112 m high and 7 m basal width. Choosing 110/7 is a design approximation. A broad oak crown at this height, the branch academy and its machine loads are explicit fantasy. No oak botanical or structural-engineering claim is made. |
| Neighbouring jungle trees | 30–45 m canopy; selected 60 m emergents; four rare 85–88.5 m landmarks | The [Smithsonian tropical-forest layer guide](https://striresearch.si.edu/rainforest/home/rainforest-layers/) distinguishes canopy, understory and emergents. [Amazon Aid](https://amazonaid.org/trees/) describes a canopy around 40 m and taller emergents. The four values are authored representatives, not a universal Amazon average. |
| Forest trunks / crowns | 0.85–1.6 m ordinary basal diameters; rare trunks 2–2.2 m; ordinary 11–16 m crown spans | Deliberate relative proportions for the illustrative forest. Species, age and environment vary; these are not measurements of individual specimens. |
| Home branch | top 32 m above floor; major root face up to 3 m thick, tapering below 1 m | Fantasy ancient oak scaffold. It preserves the starter's local contact face and supports preparation stands across the new named builds. |
| Other major oak scaffolds | 0.65–1.8 m root thickness;0.12–0.35 m tips | Actual editable polygons. Their elevated attachments clear the tested Elephant/Bear mechanisms; they are not decorative promises of contact. |
| Smaller branch/stem/log props | narrow 0.18 m spring-stem contact faces; ordinary fallen logs 0.25–0.50 m diameter | Actual editor geometry. Six-to-eight-metre spring routes are groups of stems/leaf mats, not single giant leaves. Ordinary painted leaves remain centimetre-scale. |
| Academy doorway | 1.4 wide×2.15 high | Existing physical-world drawing dimensions preserved. No human figure or operator is introduced. |
| Space | free-drift boundary 3,000 m; starlight/reduced-gravity region starts 960 m | Existing bounded arcade state, not actual escape velocity or real lunar atmosphere. Crossing still comes from the simulation. The height strip cannot grant escape from its marker position. |

Rare Amazon record trees are not the normal canopy. [Cambridge Botanic Garden’s expedition report](https://www.botanic.cam.ac.uk/expedition-finds-the-tallest-tree-in-the-amazon/) describes an exceptional 88.5 m Dinizia excelsa. Four rooted 85–88.5 m landmarks use that height anchor. Their trunk diameters, crowns and 13 short physical boughs are authored dimensions, not measurements of that specimen. They stay below the 110 m oak; the unchanged ordinary forest supplies most of the route.

The 110 m oak is 3.14 times the chosen 35 m tree. A 0.08 m frog is 1/1,375 of its height, so it is intentionally subpixel in a whole-world view. Separate zoom panels and dashed nominal envelopes make the small animals legible without enlarging them dishonestly in the common-scale grove panel.

## Animals and measurement axes

All existing masses and catalogue envelope dimensions are preserved, as are stable save IDs and fixture profiles. A representative species and biological axes are recorded for **every** volunteer in [species.md](species.md) and [critter-scale.js](../../src/critter-scale.js). The existing 6×2.6 m,5,000 kg Elephant is coherent with an adult male Asian-elephant example. It has not been silently changed into a larger African bull.

The game uses a two-dimensional local **length×height envelope**, including a posed tail, folded limbs or ears. That is not universally a shoulder-height or straightened nose-to-tail measurement. The guide sorts by longest game-envelope dimension. Its biological references retain the original axis and statistic: ranges, means, experimental mean±SD and upper summaries remain separate. Dashed brackets measure the nominal envelope; painted ink need not occupy every corner. The art is recorded from the game's existing ready-pose drawing function, not a second set of stretched animal pictures.

## One canonical map and save compatibility

`createGroveMap()` now returns V4 revision 4 with the 110 m oak,32 m launch deck and 378 editor objects: **231 solids,16 pass-through fields and131 scenery objects**. The original four small opening rebound faces remain, supplemented by early top-landing perches and short rooted forest bays; neighbouring crowns, trunks, thin boughs, seedpods, ground logs and stones have measured positions. The source-position [map figure](images/map.png) shows all 376 lower-world objects, including the forest through 733 m. Two orbital encounters remain higher at 1,032/1,432 m and appear in the complete inventory/editor.

Runtime and editor use the same factory, validators, object art and oak/forest dimensions. V4 Whole Tree view fits the actual crown/floor on desktop and phone; initial editor framing uses it. Setup and ordinary follow mechanics are unchanged. The height strip anchors floor near bottom, the 55 m oak centre at the middle, crown 110 m above that, and compressed space at the top.

All nine old starter generators are retained byte-for-byte. Only an **exact untouched** old default is upgraded on read, without writing its stored bytes. Any edited old geometry, name, material, collision, density or target retains its old world dimensions and art. V4 custom edits save/load through the normal editor. Malformed old bytes are left intact and can be recovered; startup falls back for the session. The guide itself writes no game/map storage. Its recipe trials use QA Creative mode and never purchase or persist Adventure state. Existing QA editor-session work is not reset just to show the guide.

Pending V3 space rewards remain valid after the new launch-origin change: restore uses the captured world descriptor to maintain absolute altitude, keeps zero gravity and immutable reward data, and banks the frozen packet only once. V4 descriptors must match the real 3,000 m world. Existing wallet totals are never multiplied.

## Physically larger named-part machines

See [builds.md](builds.md) for all equipped parts, actual dimensions, current discrete partial/full measurements and reproduced faults. Axle heights are 1.2,3.462,8.1 and 16.2 m; whole beams are 1.3,3.75,10.2 and 20.4 m. The Elephant now uses Giant gantry, Ironwood beam, Continental ballast with 300 t steel fill, Elephant harness, Titan cable, Precision bearings, Polished release pin and Gantry winding wheel. Its real harness capacity is 8 t and the volunteer is 5 t. These are explicit optional configurations; existing owned builds and capacities are preserved.

The local follow-up fixes the demonstrated ordinary partial-draw failures and Bear re-drop requirement. Sixteen 120 Hz measurement cases use one Enter each and finish cleanly, with 64 launch combinations additionally checked across 20–120 Hz preparation. Large baskets move gently enough for actual loose support; partial stops settle without pose resets. Known recipes hold the ratchet below their stated 40%/60% calibration instead of launching into the demonstrated weak-draw failure regime. Starter normal flight, damping, catalogue material limits and gravity-driven release are preserved. Custom altered geometry/maps still require their own tuning; native comfort/visual acceptance remains pending.

### Current space acceptance blueprint

The old −15° endgame blueprint is preserved, but its same 208.46 m/s launch peaks at about 993 m in V4 because the deck now starts at 32 m instead of 600 m. It must not be described as reaching space in the new world. A separate optional [V4 space blueprint](v4-space-blueprint.json) changes its pin bend to +5° within existing catalogue limits: one Enter drop, 50.05 s winding, 187.26 m/s at 65.23°, actual upward 3,000 m crossing after 47.57 s simulation time, 28.34 m/s upward velocity remaining, no impacts/failure. This is a synthetic physical-controller regression, not completed native acceptance. No existing player build or save is edited. The 220 m endgame rig is fantasy equipment separate from the four ordinary grove-scale recipes.

After the idle interval, inspect the synthetic QA tab before any input. If it still has the old −15° test build, use the separate V4 blueprint only in that nonpersistent QA session; do not repeat a progress import or change personal game storage.

## Figures and reproduction

- [Small animals](images/small.png), [animals and real rig sizes](images/large.png), [whole grove lineup](images/world.png), [props/encounters](images/props.png), [authored map positions](images/map.png).
- The adjacent `.svg` files retain vectors and text; [inventory.json](images/inventory.json) contains dimensions and stable source IDs.
- `node scripts/export-scale-guide.mjs` regenerates the five SVG figures and inventory directly from source. PNGs were rendered from those SVGs using temporary `@resvg/resvg-js`2.6.2 installed outside the repository; the game has no new runtime dependency.
- These are source-rendered comparison figures, **not native gameplay screenshots**. The figures have been visually inspected for relative scale, readable labels and small-object visibility.

## Verification and remaining native checks

Final integration checks and release state are recorded in [the release checklist](release-readiness.md). Source figures are regenerated from the canonical map, not copied from the old hosted build.

Focused integration checks cover complete inventory and field/solid classification, nominal animal envelopes, real machine geometry, shared tree/map dimensions, uniform figure transforms, all 11 existing ready-pose art exports, safe query recipe entry, custom missing crowns/horizontal chains, and V3→V4 space completion restoration without duplicate payment. Camera/editor, map migration, physical loading/launches, botanical art and existing game regression suites are run separately and together. Archived V3 journey/art benchmarks remain explicitly on V3; new V4 route tests cover the actual new default rather than pretending old 600 m-deck journeys still apply.

Native Chrome desktop/phone acceptance for this world, unified tools and field-guide layout is pending: this task currently has no supported browser-control tool. User Chrome work has not been interrupted. The earlier held-key space test remains pending. After Ready: inspect the guide at actual phone size; verify editor custom-save/load/reset in isolated QA; try all four recipes at calibrated partial/full draw with one Enter drop each; then complete native reachable space→achievement→Collect×7→reload/retry exactly-once acceptance in the separate synthetic origin. Restore only QA viewport/tab changes afterward. The guide keeps its intrinsic figure scale on phones instead of shrinking labels, supports horizontal keyboard focus and provides named inspect buttons. These are source/layout checks; no native acceptance or fresh exact-SHA CI is claimed for this uncommitted scope.

The public package includes the scale guide, figures and explicit developer entry. The entry shares the existing runtime and browser-local map; it is unlinked from ordinary Play and is not authenticated. Deployment identity is exposed in `/release-source.json`; see the release checklist for acceptance limits.

All 28 prepared route cases finish naturally. Four rare rooted emergents shorten several full-draw upper routes, while starter and Medium cases remain exact. Full Bear natural/air/staff gaps change 3.75→3.23 / 7.46→5.40 / 8.54→5.03 s; full Elephant natural/air changes 5.40→4.68 / 7.16→6.49 s. Elephant75% natural worsens 4.20→4.72 s and full staff remains8.43 s. Range changes with honest passive contacts. The roughly one-second goal is **not complete**. See [complete before/after evidence](upper-route-comparison.json), including regressions; the prior [12-case evidence](route-measurements.json) is the released revision-two baseline. No invisible walls or injected boosts were added.

The revision4 follow-up adds only one visible7.07m wood fork, rooted inside an existing45m tree at25–26m altitude. In the36-case forest/whole-flight comparison it changes the full natural Elephant return: longest gap4.679→4.081s, distance414.19→373.74m, flight23.825→22.723s. Other measured gaps do not regress by more than0.05s. Three bird-layout variants were rejected because shorter gaps came with excessive distance loss or prolonged aftermath. The remaining4.081s maximum is upstream, and the one-second target is still incomplete. See [criteria](interaction-criteria.md) and [current comparison](forest-corridor-comparison.json); prior route JSON files are explicitly archived.
