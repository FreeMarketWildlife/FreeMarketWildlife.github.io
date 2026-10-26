# Sermon notebook and draft workshop

The existing Philip Aram Sermons tab remains at `/philip-aram/#sermons`. Generic website code never contains personal sermon entries, source attachments or drafts. No pixel artwork or new visual assets are used by the workshop.

## Storage and existing data

The original notebook retains `fmw:philip-aram:sermons:v1`, its existing validation/import/export, metadata and notes. Its export remains a v1 notebook backup. Opening **Workshop draft** lazily copies that entry's notes to a separate v2 store, `fmw:philip-aram:sermon-workshops:v2`, with the same sermon ID and a read-only initial revision. It does not edit or delete the original notebook record or any other workspace data. The notebook's original editor and backup remain available; subsequent workshop text lives in the workshop, not in the original notebook snapshot.

Workshop drafts, versions, sources, day notes and comments are browser/device/origin-local. Production and localhost previews are separate origins. Server sign-in protects the workspace route but does not synchronize sermon data. Inspection of `services/workspace-auth/src/worker.js` and `docs/auth/DEPLOYMENT.md` found account/session/membership APIs and task-photo storage, but no sermon data API. This change adds no backend route, credentials, paid API or outbound AI calls.

`sermon-workshop.js` validates each workshop: bounded draft text (50,000 characters), up to 200 immutable revisions, 1,000 comments, 30 source attachments, and 8 million serialized characters per packet. localStorage has a browser-dependent quota; failures keep the on-screen draft and show export guidance. Corrupt storage pauses editing and offers raw recovery export. A changed storage value from another tab blocks writes instead of overwriting the other tab. Export current work before reloading to merge.

## Annotate and revise

- Edit **Speaking draft**; changes save locally on input. **Save immutable version** snapshots it under a label. Old snapshots cannot be edited in the interface.
- Select text in the draft, then add a passage annotation; or choose a section/whole-sermon scope. Notes have stable IDs and open/resolved states. Resolve/reopen preserves the note.
- Passage/section anchors retain the original exact quote, nearby context, offsets and originating revision ID. Unique unchanged quotes can move. Changed/missing quotes and ambiguous duplicates are visibly stale. **Reattach to selected text** is explicit; notes are never silently dropped.
- Compare a saved version with the current draft using line additions/removals. Large comparisons fall back to complete before/after blocks. Restoring a version preserves unsnapshotted current working text as a new revision first.
- Original source attachments are read-only after saving and remain separate from the speaking copy. No content is automatically rewritten.

## Creation Week

The workshop has a compact clickable 1↔4, 2↔5, 3↔6 comparison and a separate day-seven card. Each day exposes a passage link, passage summary, Phil's observations, open questions, editorial cautions and cross references. Missing personal observations remain explicitly empty. Vegetation is day three; luminaries are day four. Pairing is a thematic aid, not a proof of one chronological interpretation.

Each day has editable annotations and independent immutable day-note versions (maximum 500 per workshop). Day notes auto-save locally; **Save day N note version** creates a snapshot. Restoring one preserves the current day note before restoration. No day-note action edits the speaking manuscript. Personal Creation Week content travels only through a private revision packet, never a public seeded JSON asset.

## Honest handoff to Dot

The visibility notice is explicit: Dot cannot automatically see annotations. There is no “send to AI” button.

1. Add comments and save a manuscript/day-note version.
2. Export **Markdown revision packet** or **JSON revision packet**, or prepare copyable packet text.
3. Attach the file or paste the packet in the chat with Dot, requesting the next draft.
4. Import a returned structured packet, or paste its Markdown speaking draft into **New draft from Markdown** and import it as a new version.

Exports include current text, full revision history, all open/resolved/stale notes, source attachments and Creation Week data. The user chooses where to share these private files. Markdown includes a single-line fenced `sermon-workshop-json` block for lossless roundtrip; keep that block intact when importing structured history. Plain speaking Markdown uses the separate draft-import control.

Default packet import merges notes/history and keeps the current working draft. The explicit returned-draft mode snapshots unsaved local working text before adopting the incoming draft as a new revision. Revision ID collisions with different contents stop the import atomically. Conflicting comments/sources are retained as labeled imported copies; repeated imports do not multiply the same conflict. Different Creation Week annotations remain in imported day-note history and differing context is retained as a source attachment rather than overwriting local notes. Workspace/sermon mismatches are rejected. Text renders via textContent; passage URLs require HTTPS without credentials.

## Validation and release boundary

Run:

```
node tests/test_sermons.mjs
node tests/test_sermon_workshop.mjs
node tests/test_quiet_time.mjs
python3 scripts/check_site.py
```

Browser QA uses synthetic data on `http://localhost:4199` separately from the private user preview at `http://127.0.0.1:4199/philip-aram/#sermons`. Verify annotation creation, moved/stale anchors, resolve/reopen, refresh persistence, version immutability, comparison, packet roundtrip, source retention, and day-note persistence. Desktop and 390px mobile layouts must remain usable without horizontal overflow.

The protected Worker serves the workspace page and generic workshop/presentation assets. GitHub Pages packaging excludes `/philip-aram` and all service source. Personal packets are kept outside the public repository and release assets. Account access, backend code, bindings, route ownership and database schema are unchanged.

## Native presentations

`sermon-presentations.js` adds a separate library in the Sermons tab. The store is `fmw:philip-aram:sermon-presentations:v1`; it does not write either notebook or workshop key. Data is browser, device and origin local, without account synchronization. Import the private JSON packet, then use **Export presentation backup** to retain it outside browser storage. A title/count and saved-status message confirm the import. Reload before relying on a presentation at an event.

Version 1 packet fields: `workspace: philip-aram`, `kind: sermon-presentation`, `id`, `title`, `slides`, optional `sourceDocuments`. Each slide has stable `id`, `title`, `body` paragraphs, spoken `notes`, `section`, `appendix`, `status`, `visual`, `readings` and `sources`. Optional `originalScript` and `editorialNotes` keep recovered wording/provenance and cautions separately from the speaking copy. Optional `day` (1–7) links the Creation Week overview to individual details. Evidence labels are Scripture, Interpretation, Illustration, Open question and Application; the chosen label remains visible during progressive reveal. Readings contain a reference, HTTPS link and optional short attributed excerpt. External sources require HTTPS without embedded credentials. Text uses DOM text nodes; only fixed original vector presets use SVG markup.

Imports validate sizes, workspace, IDs, links and fields before writing. Identical content imports once, ignoring remembered slide position. A changed packet with the same ID becomes a new labeled copy; it does not replace a locally edited deck. A storage conflict from another tab stops the write and requests export/reload. Corrupt or unavailable storage pauses saves and retains the stored bytes. Quota failures are reported; the source packet remains available for recovery. There is no automatic upload or AI submission.

**Present core slides** omits appendix slides; **Present with appendix** includes them. Right/Space/PageDown reveal successive paragraphs, then advance; Left/PageUp reverse. Home/End navigate to first/last; N toggles private speaker notes; Escape exits. Full screen uses the browser API when supported. Creation Week day buttons open detail slides and **Return to talk** returns to the overview. Notes are hidden by default and show the speaking script separately from expandable original-script references and editorial cautions. Slide title, paragraphs, script, original reference, cautions, readings, source links and evidence label can be edited and explicitly saved. Original source documents remain read-only.

Automated coverage: `node tests/test_sermon_presentations.mjs`, plus `tests/test_sermon_presentations_browser.cjs` with Playwright and a localhost preview. Browser tests use synthetic data by default. An optional `SERMON_PACKET` absolute path allows a private local QA packet; never commit it or its screenshots. The test verifies desktop/390px/320px import, repeat import, reload, editing, existing-store preservation, keyboard/notes/escape/focus, day navigation, no network writes and every fully revealed slide fitting a desktop canvas. `SERMON_QA_OUTPUT` chooses an ignored/private screenshot folder. Visually inspect every slide and mobile controls before release.

Backups read the current editor fields, including edits whose save failed. If those fields are valid, the JSON is a normal presentation packet. Invalid fields produce a clearly typed `sermon-editor-recovery` packet containing the original presentation and every raw editor field; recover those values by pasting them into the editor. Import refuses this recovery type until it is repaired, preserving the saved deck. Repeated conflict imports reuse a matching preserved copy. All-appendix decks disable core-only playback. Slide/reveal changes have a compact live announcement for screen readers.
