# Physical launcher recipes · local scale pass

These optional recipes use existing catalogue parts and actual solver metres, grams and capacities. They do not migrate a saved build, purchase equipment, change prices, grant ownership, or replace the 1.2 m starter. `createScaleBuild(id)` returns an independent configuration; fitting it in Adventure must retain the ordinary ownership checks. Small is exactly the existing `STARTER`. This pass is local only; it has not been committed, pushed or published.

The setting is fantasy engineering. A giant oak supporting an 80-tonne counterweight is an arcade construction, not a structural assessment or a safe way to launch a real elephant. The game’s existing 6 × 2.6 m, 5,000 kg Elephant volunteer is unchanged.

## Geometry at one common scale

All lengths below are metres. Beam length includes both sides of the axle. Long-side reach includes long arm + cord + half volunteer length; it is a geometric envelope, not guaranteed terrain clearance or a rendering zoom. Stationary width includes frame feet, launch guide, preparation stand and front crank support.

| Recipe | Volunteer | Axle | Feet width | Whole beam (long + short) | Cord | Long-side reach | Guide length | Stationary width | Pouch opening | Capacity / payload |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Small · Acorn Flyer | mouse | 1.2 | 0.8 | 1.3 (1.04 + 0.26) | 0.96 | 2.09 | 1.6 | 1.71 | 0.2 | 0.15 / 0.025 kg |
| Medium · Oak field launcher | rabbit | 2.7 | 2 | 3.8 (3 + 0.8) | 2.7 | 5.925 | 4 | 4.414 | 0.55 | 3 / 2 kg |
| Large · Braced bear launcher | bear | 8.1 | 6 | 10.2 (7.8 + 2.4) | 7.2 | 16.1 | 16.5 | 16.619 | 2.64 | 500 / 250 kg |
| Elephant · Elephant grove gantry | elephant | 16.2 | 12 | 20.4 (15.6 + 4.8) | 14.4 | 33 | 33 | 33.238 | 5.28 | 8,000 / 5,000 kg |

| Recipe | Frame mass | Counterweight fill | Calculated beam mass | Guide x bounds | Stationary x bounds | Maximum geometric height above floor¹ |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| Small | 1.5 kg | 6 kg | 0.364 kg | -1.2 … 0.4 | -1.2 … 0.51 | 35.29 |
| Medium | 30 kg | 150 kg | 26.6 kg | -3 … 1 | -3.104 … 1.311 | 40.625 |
| Large | 1,650 kg | 7,500 kg | 2,816.883 kg | -12.375 … 4.125 | -12.375 … 4.244 | 56.2 |
| Elephant | 17,600 kg | 80,000 kg | 22,535.064 kg | -24.75 … 8.25 | -24.75 … 8.488 | 81.2 |

¹ V4 launch deck is 32 m above the forest floor. This maximum is axle + long-side envelope + deck altitude, not the measured apex. Even the Elephant gantry fits within the 110 m Grandfather Tree silhouette.

## Exact equipped parts

The IDs in parentheses are the existing persisted catalogue IDs. The recipes use each selected part’s real capacity, material density, friction, rope strength and crank power. No hidden mass multiplier or launch impulse is added.

| Slot | Small | Medium | Large | Elephant |
| --- | --- | --- | --- | --- |
| Foundation | Root anchors (`anchored`) | Root anchors (`anchored`) | Root anchors (`anchored`) | Root anchors (`anchored`) |
| Throwing arm | Oak beam (`oak`) | Oak beam (`oak`) | Ironwood beam (`ironwood`) | Ironwood beam (`ironwood`) |
| Frame | Sapling A-frame (`sapling`) | Timber tower (`timber`) | Braced tower (`braced`) | Giant gantry (`giant`) |
| Counterweight capacity | Boulder basket (`boulder`) | Quarry basket (`quarry`) | Mountain ballast (`mountain`) | Mountain ballast (`mountain`) |
| Ballast material | River stone (`stone`) | River stone (`stone`) | Steel plates (`steel`) | Steel plates (`steel`) |
| Counterweight joint | Swinging hanger (`hinged`) | Swinging hanger (`hinged`) | Swinging hanger (`hinged`) | Swinging hanger (`hinged`) |
| Pouch | Leaf pocket (`pocket`) | Canvas pouch (`pouch`) | Great hammock (`hammock`) | Elephant harness (`elephant`) |
| Sling cords | Braided twine (`twine`) | Hemp cord (`hemp`) | Steel cable (`cable`) | Steel cable (`cable`) |
| Axle | Bronze bushings (`bronze`) | Bronze bushings (`bronze`) | Precision bearings (`precision`) | Precision bearings (`precision`) |
| Release finger | Polished release pin (`polished`) | Polished release pin (`polished`) | Polished release pin (`polished`) | Polished release pin (`polished`) |
| Crank wheel | Acorn crank wheel (`hand`) | Brass geared wheel (`geared`) | Iron capstan wheel (`capstan`) | Iron capstan wheel (`capstan`) |
| Launch trough | Timber launch rail (`runway`) | Timber launch rail (`runway`) | Timber launch rail (`runway`) | Timber launch rail (`runway`) |

Medium is the existing Rabbit geometry with the Brass geared wheel. Large retains the existing Bear dimensions, fitted with the smaller sufficient Braced tower, Mountain ballast, Iron capstan and Steel cable. The original Bear preset’s Titan cable was unnecessary at this scale; the final Steel-cable variant was separately tested before selection. Elephant is a deliberately smaller Giant gantry than the old 24.3 m axle Elephant preset: 16.2 m axle, 12 m feet, 20.4 m beam, 80,000 kg steel fill, 5.28 m pouch opening. Its steel cable retains a meaningful finite 2.5 MN breaking load.

Elephant’s exact custom values are in [scale-builds.js](../../src/scale-builds.js). In particular: 15.6 / 4.8 m arm sides, 1.14 m beam thickness, 17,600 kg frame, 3 m hanger, 14.4 m cords, −45° release bend, 0.15 m finger and axle radius, 28° draw angle, 33 × 0.36 m guide, 2 braces. Other persisted settings remain the existing scaled preset values. The catalogue geometry/capacity validator reports no warnings for all four recipes.

## Bounded candidate search

Only three new Elephant designs were searched; the other three configurations are the fixed Small/Medium/Large recipes. Including the original Titan-cable Large comparison, this is seven distinct configurations, below the requested 24-candidate cap. The three Elephant designs used the same existing parts and proportional geometry, with a Steel cable and Iron capstan. Raw full draw initially used no editor map or loose preparation bodies to isolate the mechanism; these results were selection evidence, not final gameplay acceptance.

| Elephant candidate | Axle | Whole beam | Feet | Counterweight | Raw full-draw release | Peak tension | Decision |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| k5 | 13.5 m | 17 m | 10 m | 50 t | 14.72 m/s, −40.96° | 8.43 MN | Reject: cable snapped |
| k6 | 16.2 m | 20.4 m | 12 m | 80 t | 18.63 m/s, 54.14° | 1.61 MN | Select, then verify physical preparation on V4 |
| k7 | 18.9 m | 23.8 m | 14 m | 100 t | 19.27 m/s, 43.13° | 1.96 MN | Works raw; larger than necessary |

Three raw draw fractions (0.2, 0.6, 1.0) were then measured for each fixed recipe. These were no-map mechanical comparisons, not hand-played viewport benchmarks. All terminated with finite states; partial draws are not universally reliable. A failure can change release direction rather than merely reducing range.

| Recipe | 0.2 draw | 0.6 draw | 1.0 draw |
| --- | --- | --- | --- |
| Small | Cord snap; 2.47 m/s, −173.23° | Clean; 13.15 m/s, 33.41° | Clean; 22.00 m/s, 38.94° |
| Medium | Beam overload; 2.33 m/s, 38.74° | Clean downward release; 12.42 m/s, −25.65° | Clean; 20.16 m/s, 40.41° |
| Large | Clean; 10.02 m/s, 34.08° | Clean downward release; 6.57 m/s, −76.35° | Clean; 15.98 m/s, 43.37° |
| Elephant | Cord snap; 10.47 m/s, −46.32° | Cord snap; 9.50 m/s, −53.86° | Clean; 18.63 m/s, 54.14° |

The Small weak-draw behavior is existing baseline behavior. No baseline gravity, impulse, strength, release timing, drawing scale or loading behavior was changed to improve these numbers. These recipes are verified at full draw, not certified over every possible partial draw or edited map.

## Actual preparation and V4 gameplay verification

The final checks use canonical `createProportionedGroveMap()`, V4 launch altitude 32 m, actual `createPayloadLoading`, explicit Enter physical drop, 30 consecutive supported preparation frames, held `wind(1/120)` to full draw, and actual `fire()`. Preparation and its ragdoll remain loose. If winding unseats the volunteer, a second explicit Enter drop is tested at the held ratchet; there is no hidden centering, welding, frozen pose or injected launch velocity. Flight runs at 1/240 s external steps until normal completion. Authored map targets may activate after release; player weapons are unused. Distances below are route results, not pure ballistic range.

| Recipe | Powered winding | Enter drops | Release | Peak cord tension | Distance | Max height above floor | Flight/swing completion |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| small | 3.008 s | 1 | 21.729 m/s, 39.336° | 21.306 N | 58.447 m | 41.009 m | 13.832 s |
| medium | 3.008 s | 1 | 20.355 m/s, 41.018° | 826.732 N | 58.738 m | 48.253 m | 10.898 s |
| large | 2.008 s | 2 | 15.981 m/s, 43.371° | 95,650.982 N | 101.361 m | 58.547 m | 20.418 s |
| elephant | 8.892 s | 1 | 18.59 m/s, 54.464° | 1,437,429 N | 84.66 m | 73.488 m | 18.542 s |

All four finish with no failure, a clean forward/upward pin release, finite states, tension below their equipped cord limit, and bending stress below the existing beam failure threshold. There are no pre-release arm, counterweight or payload contacts with world objects other than the home branch. Large needs a second Enter after its loose Bear is unseated during the two-second wind; this limitation is exposed rather than concealed by a pose reset. Elephant retains real residual preparation motion at firing. Native visual/controller acceptance belongs to the parent integration pass; these are code-level physical controller tests, not a claim of Mac browser QA.

### Demonstrated world-clearance fixes

Before map correction, the first west oak scaffold blocked the Elephant arm at 1.51 s and the Large payload at 2.44 s. Elephant snapped; Large’s intended upward release became only 7.4°. Raising the authored solid scaffolds cleared both actual mechanisms. The next check found the old elder beetle inside Elephant’s pre-release arc, causing another snap. The map author relocated the two upper targets onto upper scaffolds. The home branch also extends west to −20 m to support the visible −14.35 m loading stand and its width. These are honest canonical editor polygons/targets; no collision immunity, invisible clearance, force impulse or cable buff was used. After release, the Elephant can still hit an oak scaffold naturally.

The sanitized source measurements are in [scale-builds-measurements.json](scale-builds-measurements.json). They contain configuration and simulation data only.

## Regression coverage

Run `node --test test/scale-builds.test.js` (7 passing tests). Coverage includes:

- Exact starter equality and independent optional recipe copies.
- Every selected part ID, named slot, build limits, no warnings, pouch mass and opening fit.
- Increasing real geometry, actual solver pivot/tip/guide correspondence and preparation-stand footprint.
- All four physical Enter/drop/wind/release/finish sequences on the canonical map, including explicit re-drop when needed.
- No pre-release world obstruction; finite completion and actual cord/beam limits.

The source module and test write no browser storage or game progress. Existing catalogue IDs, prices, personal saves, inventory, currencies, custom geometry and the giant space blueprint are untouched by these recipes.
