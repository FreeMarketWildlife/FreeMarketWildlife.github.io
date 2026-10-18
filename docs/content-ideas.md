# Content Ideas

Content Ideas follows the existing workspace routes, styles, static preview gate, and browser-local planning pattern. It has no backend or new dependencies.

- Troy Kearns: `/troykearns/content-ideas/` (also linked from the `/troy-kearns/` compatibility page).
- Kat & Kai: `/kat-kai/content-ideas/`.
- Philip Aram: `/philip-aram/#content-ideas`.
- Philip’s Tanoshi, Equip, and Critz planning areas each have their own Content Ideas tab.

Each idea has a title, optional topic, format (Short / Long-form / Other), stage (Idea / Developing / Ready), and optional notes. Lists group by stage and sort within each group by topic, title, then stable ID. Topic search and format/stage filters help organize the list. Add and edit use an explicit Save idea button. No sample ideas or invented content are seeded.

Storage uses `fmw:content-ideas:<workspace>:v1`, separately for `troy-kearns`, `kat-kai`, `philip-aram`, `philip-tanoshi`, `philip-equip`, and `philip-critz`. This is organizational separation within local browser storage, not server authentication or account synchronization. Existing Quiet Time and planner records are not modified or migrated.

Export ideas creates a workspace-tagged JSON backup. Import ideas validates the workspace and fields before merging; another workspace’s backup is rejected. Duplicate IDs retain the current version, so repeated imports do not duplicate records or overwrite later edits. Corrupt saved data blocks writes and imports; export preserves the raw value for recovery. Save failures retain the form fields and report an error. The 500-idea cap and field limits are checked before storage writes.

Validation: `node tests/test_content_ideas.mjs`, `node tests/test_planner.mjs`, `node tests/test_quiet_time.mjs`, and `python3 scripts/check_site.py`.

Deployment includes only the empty editors and their code. Browser-saved ideas and imported backups are not uploaded by deployment.
