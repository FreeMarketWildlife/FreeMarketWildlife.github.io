# Kat and Kai subscriber roadmap

The owner requested subscriber milestones at every 1,000 from 1,000 through 10,000 and a New Year target. `/kat-kai/roadmap/` treats that deadline as January 1, 2027 at midnight America/Los_Angeles. Only the final milestone is given that deadline; earlier milestone dates are left editable rather than invented as forecasts.

`defaultPlan('kat-kai')` seeds the ten milestones. `personalizePlan` replaces only the exact untouched generic starter goals and preserves user-edited goals and their notes. Repeated migration does not duplicate milestones. Each milestone has a 3,000-character browser-local notes field, included in the existing export/import backup. This is not shared account storage.

The page calculates required future average net subscribers/day from the latest recent public subscriber snapshot and the remaining time to the Pacific deadline. It labels the number as a requirement, not a forecast. Stale observations are marked. No realistic growth forecast can be established from the two initial observations alone.

The October 19–November 2 trial is an explicit proposal: two long-form releases, four Shorts, and reviews on October 26 and November 2. Kat must confirm or revise the sustainable workload. The first review establishes what the channel can produce and what the audience responds to; later reviews determine a credible date for the first 1,000 and reassess the New Year stretch target. The plan does not promise subscriber results from upload counts.

Validate with `node tests/test_planner.mjs`, `python3 scripts/check_site.py`, and a browser check of notes after reload. The required pace calculation covers missing data, completed targets and passed deadlines. Publishing advice is informed by https://support.google.com/youtube/answer/13616979 .
