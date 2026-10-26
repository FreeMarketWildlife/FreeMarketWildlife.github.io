# Build a Business

The public adventure lives at `/build-a-business/`. It uses the existing black-and-white pixel fonts and account system.

- Skills and passions each fill one desktop/mobile viewport, including the bottom-left vertical selection list and growing Continue button. Desktop has six targets; mobile has four. Targets use separated spawning and elastic collisions. Asteroids bounce off the edges and a central ship force field, with upright labels and no gravity.
- Both stages allow ten curated selections. The tenth displays VICTORY for 1.2 seconds and automatically advances; an earlier Continue advances immediately. There are no custom-entry forms or depth badges. All choices opens a searchable, keyboard-accessible taxonomy dialog, so no unwanted parent selections are needed to reach a leaf. The only instructional copy is “What are you GOOD at?” / “What do you ENJOY doing?”.
- Up to three complete business cards sit side by side on desktop and stack on mobile. Offer, customer, actual matched answers, first step and qualitative ratings stay visible, with a GET TO WORK action. Sparse answers show fewer strong options and a refine-answers action.
- `assets/js/business-model.js` owns the unchanged curated taxonomy and deterministic matching shared by browser and Worker. `content/business/*.json` contains 500 editorial business ideas; `scripts/build_business_catalog.mjs` validates and generates `assets/js/business-catalog.js`. Eligibility requires separately reported skills and interests. Explicit-interest clauses precede ranking: dog walking requires Dogs plus Walking or Walking dogs. Unknown selections never produce a fallback. See `business-catalog-contract.md` for the schema, rubric and maintenance workflow.
- The browser saves a versioned adventure for up to 30 days, including draft name/message. Start over clears that adventure. Google returns to the adventure; email verification stays on the invitation. Signing in does not submit an inquiry automatically.
- Submission requires a verified account, name, explicit sharing consent, 1–10 skills and interests, and one of the server-derived three matches. Notes are optional, up to 4,000 characters. No workspace access is granted.
- Private D1 records include the verified email, selections, all three recommendation snapshots, choice, notes, time, and notification state. User input is rendered as text, not HTML. Identical retries reuse the inquiry; three new plans per account per rolling day are allowed.
- Resend sends the details to the configured `OWNER_EMAIL` with Reply-To set to the verified visitor. Provider acceptance marks the record `sent`; this does not prove inbox delivery. Failures retain the record. A Cloudflare schedule retries every 15 minutes, at most five delivery attempts. The owner inbox also supports manual retry.

## Owner inbox and booking

Open `/account/business/` using the owner’s Google account, or follow **Business inquiries & meeting settings** from `/account/`. Direct notification links preserve their inquiry destination through Google login. Other accounts cannot read the inbox or update settings.

Paste a Calendly **event** URL such as `https://calendly.com/your-name/business-chat` into Meeting booking. Connect Zoom within Calendly and choose Zoom as the event location. The scheduler then appears after submission. Without a configured link, the page offers email scheduling; it does not claim a meeting has been booked. Settings are stored in `business_settings` and survive deployment. `BUSINESS_BOOKING_URL` is an optional environment fallback.

`assets/js/business-scene.js` owns the scene lifecycle, collision physics, force-field and wall collisions, responsive target sizes, and low-resolution black-and-white canvas scenery. Motion pauses for keyboard focus, Pause motion, reduced-motion preferences, and hidden tabs. Run `node tests/test_business_physics.mjs` for collision and force-field checks and `node tests/test_business_motion.cjs` with the same browser setup for actual movement and scene checks.

## Backend

`services/workspace-auth/src/business.js` handles `/api/business/config`, authenticated inquiry submission, owner-only inquiry retrieval/settings/retry, notification delivery, and the scheduled retry handler. Migration `0004_business_inquiries.sql` adds private tables without changing memberships.

Use `npm test` and `npm run check` inside `services/workspace-auth/`. `tests/test_business_browser.cjs` runs desktop/mobile browser checks against prepared assets on port 4173; it uses account, email, and submission fixtures. Set `BUSINESS_BASE_URL` and `BUSINESS_QA_OUTPUT` to inspect published assets with those same fixtures. This is browser emulation, not physical-phone testing.

## Publication, October 24, 2026

Release staging and QA evidence: `outputs/build-a-business-2026-10-24/` (ignored generated artifacts). The release was built from the exact latest published asset set and deployed source snapshot, preserving the newer Troy Strategy library and unrelated work. Nine owned assets changed. The separate original checkout retains its pre-existing uncommitted work; do not publish its whole asset build over production without reconciling newer hosted content first.

A controlled production inquiry test uses a temporary synthetic client identity, verifies the actual API/database and Resend acceptance, and removes its test user, session, and inquiry. It does not exercise a fresh human Google login or prove delivery into the recipient’s inbox. The owner receives one clearly labeled test notification.

To remove an inquiry after an owner-requested deletion, delete its row from `business_inquiries` by ID using the existing authenticated D1 administration workflow. Account/session deletion is separate. The website privacy page explains storage and contact-based removal requests.
