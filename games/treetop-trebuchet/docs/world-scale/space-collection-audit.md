# Space collection audit · 21 October 2026

The independent follow-up reads the actual escape, reward, persistence and UI paths. `node --test test/space*.test.js` passes53 focused checks, including17 actual-handler VM tests. These use isolated memory storage and a real solver boundary fixture; they never read or write the player's browser save. They are not native browser/localStorage acceptance. The no-save `qa=1` route intentionally skips durable saving.

## Reward contract checked

- Crossing the actual3,000m escape boundary freezes a validated packet. Later zero-gravity drift cannot enlarge its distance, altitude or reward totals.
- This run's normal rounded Bells, including the existing mass bonus, and points are each multiplied by **seven**. Existing wallet/lifetime totals, best distance and launch count are not multiplied. Collection adds one launch and advances the existing shop once.
- The achievement is recorded once and persists. Repeated floating frames do not create another packet. A new legitimate run may earn another sevenfold reward without adding another achievement.
- Reload before collection restores the original pending world/build/result. Reload after collection does not pay again. Save failures preserve an uncredited packet and allow one later successful retry. Sequential stale UI collectors cannot overwrite a payment plus later earnings or resurrect a claimed packet.
- Creative awards no Adventure currency, achievement or pending completion. Numerically invalid/configuration-invalid runs do not qualify. Existing rules still allow an actual mechanical cord/beam failure that subsequently reaches space; this is not an invented new reward exception.

## Demonstrated correction

The former Collect handler appended a session-log reward before `bank()` checked supported numeric totals. At wallet/points/launch-count overflow it threw, left a phantom reward-log entry and gave no controlled collection error. The wallet was not paid, so this was a consistency/feedback bug rather than an extra-reward exploit.

Collection now stages its ledger, log and shop successor, catches domain errors, and publishes the log/new-shop notification/banked state only after persistence succeeds. Domain or write failure leaves the actual pending result and prior ledger/log intact. The player receives the error and may retry. An explicitly labelled shop-successor fault injection additionally verifies atomic rollback and one successful later retry; normal valid catalogue data was not found to throw there.

Three new actual-handler regressions cover overflow of each supported ledger category, injected shop failure followed by successful retry, and a stale collector after another tab's payment plus later earnings. Existing source tests continue to cover frozen rewards, repeated marks, double clicks, ordinary/Creative behavior, save import, restoration and failed writes.

## Limits

The cooperating-writer save-revision guard detects sequential stale saves. localStorage read/write is not an atomic cross-process transaction. The bounded claim history retains100 IDs; it is not a server-owned transaction ledger or tamper-proof anti-cheat system. No credentials or persistent grants were added.

Native reachable launch→free drift→achievement→Collect×7→reload/retry acceptance remains pending while supported browser control is unavailable. That check needs fresh isolated storage without `qa=1`; never import fixtures into the user's actual save.
