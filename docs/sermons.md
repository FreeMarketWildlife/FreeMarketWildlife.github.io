# Sermon notebook

Notes live inside Philip Aram’s existing Sermons section at `/philip-aram/#sermons`. There is one tab and the same existing route. Public source includes only the empty generic editor; no personal sermon entry is seeded.

Date, speaker and passages are required. Title/theme are optional; notes remain editable. Entries sort newest first, support search and explicit save, and persist only in `fmw:philip-aram:sermons:v1` on the current browser/device. Quiet Time, planning and Content Ideas storage are not changed. Export a backup to keep a copy; no shared backend or account sync is connected.

JSON backups include version 1, workspace `philip-aram`, kind `sermons`, and entries with unique ID, ISO date, speaker, passages, title, theme and notes. Imports validate the workspace, notebook kind, date and limits, then add new IDs while preserving existing versions. Repeated imports do not duplicate notes. Corrupt stored data pauses writes and imports; export retains the raw value for recovery. Save errors retain the form.

The existing client-side password gate is a preview barrier, not authentication. Notes are not sent to the website server by this module. Personal starter backups must stay outside public-served assets and Git.

Checks: `node tests/test_sermons.mjs`, `node tests/test_quiet_time.mjs`, and `python3 scripts/check_site.py`.
