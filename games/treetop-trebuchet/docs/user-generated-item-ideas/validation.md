# Guillotine release validation — October 21, 2026

- Published Site version 14; source commit `a7c6322a60cf989be848c6afe5317efdee0f9289`.
- Release prepared from hosted source `d35d529a3687ed4b2b5308dd2c65e06f55f6e01c` in `sites/guillotine-release`; existing local Site history was divergent and was preserved.
- Only counterweight/item UI, item physics/art, supporting dependency tags and this idea preview were included. Concurrent forest/map/art changes in the main workspace were not packaged.
- 140 release tests passed, 0 failed: guillotine, starter flight, shop correctness, capacity controls, catalogue audit/art, crank wheel, loose loading/return, and build/save systems. Verification fixture: `/tmp/treetop-guillotine-verify`; output `/tmp/treetop-release-tests-final.txt`.
- Main workspace full run: 1077 tests, 1030 passed, 47 failed in concurrent map/tree tests and expectations; output `/tmp/treetop-full-tests.txt`. Do not claim the entire shared workspace is green.
- Browser confirmed unified Counterweight category and equipped Guillotine in the full local game. Published preview loaded and completed a 13.3 m/s mouse launch with the blade stop reached.
- Physics preserves default 60 cm axle height, 40 cm footprint, 52/13 cm arms, 48 cm sling and 2 kg counterweight mass. Three starter animals load through the actual loose loading controller, transfer their real pose/motion, and release without a launch impulse.
- Fixed blade guide: 58 cm tall, 22 cm wide, 17 cm blade width. Support mass 450 g; provisional price 180 Bells. User-generated idea attribution displayed separately from existing items.
- Remaining proposed items and Dunked/Swish achievements are recorded but not implemented.
