# Volunteer scale references

Checked 21 October 2026. The comparison uses the existing catalogue values without changing masses, fixtures, launch mechanics or saved builds. A representative real species is a measurement reference for a generic game volunteer, not newly established world canon.

## What the comparison measures

`src/critter-scale.js` exports immutable `CRITTER_SCALE` records and `critterScale(id)`. Each record's `length`, `height` and `grams` come directly from `CRITTERS.length`, `CRITTERS.width` and `CRITTERS.grams`. Length and height are metres; mass is grams. The historical `width` field is the second local silhouette axis used by the 2D renderer and compound fixtures. It is not universally a standing shoulder height, body girth or third dimension.

The visible label is **Game envelope · length × height**. Sort/scale the lineup by `Math.max(record.length, record.height)` and use one common metre scale, rather than normalizing each animal to fill an equal portrait. At that scale, the whale's nominal 24 m length is 300 times the frog's 0.08 m length. Use a labelled nominal envelope or dimension bracket: posed tails, ears, trunk, ink outlines and empty corners mean painted silhouettes do not necessarily occupy every edge.

The separate `biological` measurements preserve their source axes and statistical scope. A head-and-body measurement is not nose-to-tail length; shoulder height is not upright rearing height. Do not add independently reported body/tail range endpoints and label the result a measured population range. A study's mean ± standard deviation is not its minimum and maximum. An upper-bound summary does not establish a species mean or a lower endpoint.

## Sources and unchanged game examples

| ID / game name | Game envelope L × H; mass | Biological reference and measurement convention |
|---|---|---|
| `mouse` / Field mouse | 0.18 × 0.055 m; 25 g | Wood mouse, *Apodemus sylvaticus*. Head + body 8.1–10.3 cm; tail separately 7.1–9.5 cm; mass 13–27 g. The game envelope includes its illustrated tail. [Mammal Society species guide](https://mammal.org.uk/british-mammals/wood-mouse). |
| `frog` / Tree frog | 0.08 × 0.05 m; 30 g | White's tree frog, named *Litoria caerulea* in these sources. Reported adult body length 7–11.5 cm, rather than extended hind-leg span. [Smithsonian National Zoo](https://nationalzoo.si.edu/animals/whites-tree-frog). A five-frog experiment measured mass 29.095 ± 9.635 g and snout–vent length 69.5 ± 9.5 mm, **mean ± SD**. This supports a larger tree-frog reference near the game's mass; it is not a species-wide mass range. [2012 original JEB study, Study animals and Statistics](https://journals.biologists.com/jeb/article/215/22/3965/11129/Self-cleaning-in-tree-frog-toe-pads-a-mechanism). |
| `chipmunk` / Chipmunk | 0.26 × 0.09 m; 100 g | Eastern chipmunk, *Tamias striatus*. Explicit total length 8–12 in including tail; tail separately 2½–4½ in; mass 2–5 oz, approximately 57–142 g. [Missouri Department of Conservation](https://mdc.mo.gov/discover-nature/field-guide/eastern-chipmunk). |
| `squirrel` / Squirrel | 0.45 × 0.14 m; 500 g | Eastern gray squirrel, *Sciurus carolinensis*. Total length 38–52.5 cm, tail separately 15–25 cm; mass 338–750 g. The game tail curls upward, so its envelope height is not shoulder height. [University of Michigan Animal Diversity Web](https://animaldiversity.org/accounts/Sciurus_carolinensis/). |
| `rabbit` / Rabbit | 0.45 × 0.22 m; 2 kg | European rabbit, *Oryctolagus cuniculus*. Wild rabbits are reported as 38–50 cm long and 1.5–2.5 kg; the account does not expand that length into body/tail axes. Game height includes ears and folded limbs, not a standardized shoulder measurement. [ADW](https://animaldiversity.org/accounts/Oryctolagus_cuniculus/). |
| `armadillo` / Armadillo | 0.65 × 0.27 m; 5 kg | Nine-banded armadillo, *Dasypus novemcinctus*. Texas Tech explicitly reports **mean** total length 76 cm and tail 34.5 cm; adult males 5–8 kg, females 4–6 kg. These means are not minimum sizes. [Texas Tech Natural Science Research Laboratory](https://www.depts.ttu.edu/nsrl/mammals-of-texas-online-edition/Accounts_Cingulata/Dasypus_novemcinctus.php). ADW additionally lists a 61.5–80 cm length range but does not clearly separate its axis; do not relabel it head-and-body length. [ADW](https://animaldiversity.org/accounts/Dasypus_novemcinctus/). |
| `fox` / Fox | 0.85 × 0.30 m; 6 kg | Red fox, *Vulpes vulpes*. Head + body 45.5–90 cm, tail separately 30–55.5 cm; mass 3–14 kg. The game's compact tail and crouched/flight silhouette are not a straightened anatomical specimen or standing-height claim. [ADW](https://animaldiversity.org/accounts/Vulpes_vulpes/). |
| `tiger` / Tiger | 2.6 × 0.80 m; 220 kg | Adult male tiger reference, *Panthera tigris*. The zoo fact sheet separates male head + body 1.89–3 m, tail 0.72–1.09 m and shoulder measurement 0.8–1 m. Wild male mass 100–261 kg; larger zoo males are separately noted. The game's compact 2.6 m envelope is not a claim that an extended head-to-tail specimen was measured. [San Diego Zoo Wildlife Alliance fact sheet](https://ielc.libguides.com/sdzg/factsheets/tiger/characteristics). |
| `bear` / Brown bear | 2.2 × 1.1 m; 250 kg | Brown bear, *Ursus arctos*. Head to rump 1–2.8 m, tail separately 6.5–21 cm, shoulder height 0.9–1.5 m; listed mass 80–600 kg, with larger individuals noted in the text. Upright rearing height is a different measurement. [ADW](https://animaldiversity.org/accounts/Ursus_arctos/). |
| `elephant` / Elephant | 6 × 2.6 m; 5,000 kg | Adult male Asian elephant reference, *Elephas maximus*. Body length 5.5–6.4 m; male standing height 2.4–3 m and mass 3,500–6,000 kg. All three game values fit this reference; changing to a larger African-elephant example is unnecessary. The source gives different female ranges. [ADW](https://animaldiversity.org/accounts/Elephas_maximus/). |
| `whale` / Blue whale | 24 × 4.5 m; 100,000 kg | Blue whale, *Balaenoptera musculus*. NOAA quick facts give upper summaries of 110 ft (33.528 m) and 330,000 lb (about 149.7 metric tonnes); its text also notes larger Antarctic individuals. These are not a population mass range, mean or absolute biological ceiling. No verified body-depth range is inferred for the game's 4.5 m envelope. [NOAA Fisheries](https://www.fisheries.noaa.gov/species/blue-whale). |

These references establish a plausible scale category, not exact anatomy, sex, age, subspecies, hydration or body condition for the illustrated volunteers. The bounded review found no demonstrated biological impossibility requiring a catalogue change. A real animal's mass and linear measurements also do not uniquely determine its density distribution or rotational inertia; those remain game-model assumptions.

## Existing physical and painted envelope audit

A read-only Node audit instantiated the existing compound fixtures without stepping or modifying gameplay. Every species' local fixture x-span equals its catalogue length. Occupied fixture height is 86–100% of nominal height: empty envelope corners and folded appendages are expected. Fixture mass agrees with the catalogue mass.

A sampled vector-paint audit at a common nominal length of 100 pixels, ready pose, zero angle and the normal supplied height found painted width including strokes about 84.8% of nominal length for bear and 85.9% for rabbit; other species measured about 95.7–101.2%. Painted height was about 94.5–103.5% of nominal height. This is a meaningful distinction for dimension labels: the bracket measures the authored envelope, not a tight painted bounding box. It does not justify changing collision dimensions or stretching existing artwork in this metadata pass. Flight poses, flex, outlines at tiny sizes and decorative effects can vary further; this was not native visual QA or anatomical validation.

Detailed measurements are retained in `/tmp/critter-scale-envelope-audit.json` for the coordinating task. Existing art/fixture files were reviewed and left untouched.

## Validation

Run:

```sh
node --test test/critter-scale.test.js test/critter-body.test.js test/build-species-art.test.js
```

The metadata tests cover all 11 stable IDs, direct catalogue-value agreement, explicit biological axes and statistic kinds, the existing Asian-elephant example, common-scale ordering/ratio, nested immutability and no catalogue mutation. The existing fixture/art tests cover angular-momentum preservation, supported loading, physical-angle rendering and bounded silhouettes. All 13 tests passed during this pass. No browser storage, publication, commit or native UI operation was used.
