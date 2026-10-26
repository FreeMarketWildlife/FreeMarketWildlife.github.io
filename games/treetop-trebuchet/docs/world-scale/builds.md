# Physical launcher recipes and preparation

This report records source-level measurements. Native acceptance and release status are tracked in [the release checklist](release-readiness.md). The recipes use actual existing catalogue parts, solver metres, grams, material strengths and crank power. They never purchase parts, grant ownership, alter currency, migrate saved builds or replace the 1.2 m starter. Small remains exactly `STARTER`. Recipe trials are isolated Creative/QA sessions with persistence disabled.

A redwood-height oak supporting a 300-tonne counterweight is fantasy engineering, not a structural assessment or a safe way to launch a real animal. Existing animal catalogue dimensions/masses and all material breaking limits remain unchanged.

## Actual dimensions

All lengths are metres. Beam includes both sides of the axle. Long-side reach is long arm + cord + half the volunteer's nominal length, not guaranteed clearance. Stationary width includes feet, guide, preparation stand and front crank.

| Recipe | Volunteer | Axle | Feet | Whole beam | Cord | Long-side reach | Guide | Stationary width | Opening | Capacity / payload |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Acorn Flyer | mouse | 1.2 | 0.8 | 1.3 | 0.96 | 2.09 | 1.6 | 1.71 | 0.2 | 0.15 / 0.025 kg |
| Oak field launcher | rabbit | 3.462 | 2.308 | 3.75 | 2.7 | 5.925 | 4.615 | 5.029 | 0.55 | 3 / 2 kg |
| Braced bear launcher | bear | 8.1 | 6 | 10.2 | 7.2 | 16.1 | 16.5 | 16.619 | 2.64 | 500 / 250 kg |
| Elephant grove gantry | elephant | 16.2 | 12 | 20.4 | 14.4 | 33 | 33 | 33.772 | 5.28 | 8000 / 5000 kg |

| Recipe | Frame mass | Actual counterweight fill | Calculated beam mass | Calibrated ordinary draw samples |
| --- | ---: | ---: | ---: | --- |
| Acorn Flyer | 1.5 kg | 6 kg | 0.364 kg | 40%, 60%, 80%, 100% |
| Oak field launcher | 30 kg | 480 kg | 29.12 kg | 40%, 60%, 80%, 100% |
| Braced bear launcher | 1650 kg | 60000 kg | 2816.883 kg | 40%, 60%, 80%, 100% |
| Elephant grove gantry | 17600 kg | 300000 kg | 22535.064 kg | 60%, 75%, 90%, 100% |

All four pass the existing configuration/capacity validator without warnings. Full exact geometry and equipped persisted IDs are in [scale-builds.js](../../src/scale-builds.js) and [the measurement JSON](scale-builds-measurements.json). Buying a larger frame still unlocks adjustment; it does not silently change a saved machine's dimensions.

## Every named part

| Slot | Acorn Flyer | Oak field launcher | Braced bear launcher | Elephant grove gantry |
| --- | --- | --- | --- | --- |
| Foundation | Root anchors (`anchored`) | Root anchors (`anchored`) | Root anchors (`anchored`) | Root anchors (`anchored`) |
| Throwing arm | Oak beam (`oak`) | Oak beam (`oak`) | Ironwood beam (`ironwood`) | Ironwood beam (`ironwood`) |
| Frame | Sapling A-frame (`sapling`) | Timber tower (`timber`) | Braced tower (`braced`) | Giant gantry (`giant`) |
| Counterweight capacity | Boulder basket (`boulder`) | Quarry basket (`quarry`) | Mountain ballast (`mountain`) | Continental ballast (`continental`) |
| Ballast material | River stone (`stone`) | River stone (`stone`) | Steel plates (`steel`) | Steel plates (`steel`) |
| Counterweight joint | Swinging hanger (`hinged`) | Swinging hanger (`hinged`) | Swinging hanger (`hinged`) | Swinging hanger (`hinged`) |
| Pouch | Leaf pocket (`pocket`) | Canvas pouch (`pouch`) | Great hammock (`hammock`) | Elephant harness (`elephant`) |
| Sling cords | Braided twine (`twine`) | Hemp cord (`hemp`) | Steel cable (`cable`) | Titan cable (`titanCable`) |
| Axle | Bronze bushings (`bronze`) | Bronze bushings (`bronze`) | Precision bearings (`precision`) | Precision bearings (`precision`) |
| Release finger | Polished release pin (`polished`) | Polished release pin (`polished`) | Polished release pin (`polished`) | Polished release pin (`polished`) |
| Crank wheel | Acorn crank wheel (`hand`) | Brass geared wheel (`geared`) | Iron capstan wheel (`capstan`) | Gantry winding wheel (`engine`) |
| Launch trough | Timber launch rail (`runway`) | Timber launch rail (`runway`) | Timber launch rail (`runway`) | Timber launch rail (`runway`) |

## Demonstrated faults and repairs

The first full-draw pass exposed limitations instead of hiding them. The prior Medium threw downward at 60% draw; Large threw downward at 60–80%; Elephant snapped at several ordinary partial draws. The release ring often failed to clear before reversal/shock even without a terrain hit. The baseline Small also had a cord-snap regime at very low draw. A pin-angle-only change did not repair all these states.

The final Medium uses a coherent 3 m / 0.75 m lever, 3.462 m axle, 55° maximum draw and 480 kg actual fill. Large retains its 8.1 m axle, 10.2 m beam and existing cable, but uses 60 t actual fill. Elephant retains its 16.2 m axle/20.4 m beam, and now fits Continental ballast with 300 t actual fill, Titan cable and the Gantry winding wheel. These are explicit recipe choices within existing catalogue capacities, not invisible material-strength changes or launch impulses. The previously selected 80 t/Steel-cable Elephant is superseded.

The prior Bear bowl descended at about 5.8 m/s during a two-second wind, faster than its damped freely falling passenger could follow. The new large-cargo governor limits downward bowl speed to 2.5 m/s and starts with a one-second ramp only where geometry exceeds the ordinary bearing cadence. The linear damping stays 2/s. The basket, joints, contact-based support check and actual loose pose are unchanged. Stopping holds the ratchet and lets the volunteer settle naturally. No snap, freeze, extra Enter, automatic fire or launch-pose replacement is introduced. The starter still winds in 3 seconds with no new ramp; the raw laboratory's previous power/governor equation is unchanged.

The stronger Elephant swing also exposed a real upper-scaffold collision. The lowest upper oak scaffold attachment was moved from 74 to 82 m above the floor and the others paced above it, all as canonical editable polygons. The 110 m tree and honest post-release collisions remain. No fixture immunity was added.

Exact named recipes retain the ratchet below 40% draw (Small/Medium/Large) or 60% (Elephant), and explain the minimum. Continuing the crank uses the retained draw; support returning never fires automatically. This bounds the demonstrated unsafe weak-release regimes without forcing an artificial upward velocity. Custom geometry/equipment retains its chosen settings and actual failure modes; a name-only change preserves calibration, while other configuration changes require their own tuning. Non-finite or out-of-range draw state cannot fire.

## Physical controller measurements

One physical Enter drop per case, powered winding, at least 0.25 s continuous observed support, actual release pose/motion transfer and the canonical V4 map. Preparation and external flight step are 1/120 s. No weapons, injected launch velocity, support override, pose reset, second drop or personal game save is used. Authored route interactions make distance non-monotonic with draw. These are discrete synthetic controller results, not native-browser measurements or continuous draw-range certification.

| Recipe | Draw | Winding | Release speed / angle | Peak cord load | Distance | Max altitude above floor | Completion |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| small | 40% | 1.200 s | 6.252 m/s / 37.314° | 4.222 N | 5.575 m | 35.728 m | 3.504 s |
| small | 60% | 1.800 s | 13.278 m/s / 33.123° | 6.618 N | 16.561 m | 37.380 m | 4.456 s |
| small | 80% | 2.400 s | 19.298 m/s / 32.189° | 18.636 N | 77.970 m | 38.893 m | 15.537 s |
| small | 100% | 3.000 s | 21.751 m/s / 38.966° | 20.253 N | 67.606 m | 40.942 m | 13.715 s |
| medium | 40% | 1.200 s | 15.293 m/s / 29.300° | 221.457 N | 96.068 m | 43.855 m | 13.671 s |
| medium | 60% | 1.800 s | 28.662 m/s / 16.030° | 459.972 N | 95.797 m | 43.952 m | 10.323 s |
| medium | 80% | 2.400 s | 38.652 m/s / 22.130° | 829.000 N | 123.465 m | 49.787 m | 12.683 s |
| medium | 100% | 3.000 s | 42.977 m/s / 28.892° | 1223.284 N | 109.034 m | 56.924 m | 14.302 s |
| large | 40% | 2.358 s | 13.576 m/s / 39.919° | 303997.856 N | 128.970 m | 58.445 m | 17.142 s |
| large | 60% | 3.283 s | 36.722 m/s / 10.600° | 35909.842 N | 243.813 m | 56.888 m | 16.249 s |
| large | 80% | 4.217 s | 52.500 m/s / 8.217° | 66606.501 N | 87.277 m | 57.369 m | 17.142 s |
| large | 100% | 5.142 s | 67.288 m/s / 15.496° | 108856.270 N | 182.357 m | 72.472 m | 26.071 s |
| elephant | 60% | 6.075 s | 29.283 m/s / 39.712° | 2269703.756 N | 150.196 m | 82.655 m | 22.998 s |
| elephant | 75% | 7.467 s | 42.300 m/s / 32.921° | 1834356.568 N | 258.291 m | 96.061 m | 27.939 s |
| elephant | 90% | 8.858 s | 54.551 m/s / 32.237° | 2861974.538 N | 301.623 m | 98.203 m | 18.822 s |
| elephant | 100% | 9.792 s | 61.823 m/s / 35.197° | 4332679.034 N | 325.968 m | 101.840 m | 19.069 s |

Every case finishes normally with a clean forward/upward pin release, finite state and forces below its actual cord/beam limits. All use one drop and finish winding supported. No pre-release arm/counter/payload world contacts occur except the intended home branch.

## Reproduction and remaining limits

`node scripts/measure-scale-builds.mjs` regenerates the current JSON above. `node --test test/scale-builds.test.js test/scale-preparation.test.js test/loading-partial-draw.test.js test/partial-release-state.test.js` covers loading, winding, weak/medium/full release, interruption/refusal, stops and resumed cranking. The preparation suite runs 64 complete recipe trajectories across 120/60/30/20 Hz preparation with 120 Hz external flight, verifies actual pose/momentum continuity and no automatic launch, and checks the large-basket vertical speed/contact budget. Archived starter flight measurements continue to pass without changes to the normal simulation.

The previous measurements are retained in [archive/full-draw-first-pass.json](archive/full-draw-first-pass.json) and its accompanying report. They describe the superseded first checkpoint and must not be presented as current values.

Native phone/desktop comfort, art clearance and held-input acceptance remain pending because this task currently has no supported browser-control tool. Custom maps can deliberately obstruct a rig; arbitrary altered geometry is not certified. The authored forest now continues to 733 m. Current no-weapon full-draw longest contact gaps reach 3.23 s for Bear and 4.08 s for Elephant; some weapon trajectories reach 8.43 s. See [all 36 current before/after routes](forest-corridor-comparison.json), so the roughly one-second goal remains unmet. The 220 m endgame space rig is a separate fantasy blueprint, not one of these four ordinary grove-scale machines. The old −15° variant peaks around 993 m on the lower V4 deck; the optional [V4 +5° blueprint](v4-space-blueprint.json) reaches the actual 3,000 m boundary with one drop and no injected velocity. Its native acceptance remains pending. See the release checklist for GitHub/CI/publication state.

The complete suite is run against the final source after integration; see the release checklist for the exact result.
