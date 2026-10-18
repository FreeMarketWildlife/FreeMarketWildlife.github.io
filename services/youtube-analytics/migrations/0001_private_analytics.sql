PRAGMA foreign_keys = ON;
CREATE TABLE invitations (hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, used_at INTEGER);
CREATE TABLE oauth_states (hash TEXT PRIMARY KEY, invite_hash TEXT NOT NULL, verifier TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE connection (id INTEGER PRIMARY KEY CHECK(id=1), channel_id TEXT NOT NULL, encrypted_refresh_token TEXT NOT NULL, granted_scopes TEXT NOT NULL, connected_at TEXT NOT NULL, verified_at TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE videos (id TEXT PRIMARY KEY, title TEXT NOT NULL, published_at TEXT NOT NULL, visibility TEXT NOT NULL, metadata TEXT NOT NULL, refreshed_at TEXT NOT NULL);
CREATE TABLE jobs (id TEXT PRIMARY KEY, video_id TEXT NOT NULL, report TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, next_index INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, retry_at INTEGER NOT NULL DEFAULT 0, last_error TEXT, updated_at TEXT NOT NULL, UNIQUE(video_id,report,start_date,end_date));
CREATE INDEX jobs_ready ON jobs(status,retry_at,updated_at);
CREATE TABLE analytics_rows (job_id TEXT NOT NULL, row_key TEXT NOT NULL, payload TEXT NOT NULL, fetched_at TEXT NOT NULL, PRIMARY KEY(job_id,row_key), FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE);
CREATE TABLE reporting_jobs (type_id TEXT PRIMARY KEY, google_job_id TEXT NOT NULL, last_checked_at TEXT);
CREATE TABLE bulk_reports (id TEXT PRIMARY KEY, type_id TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, created_at TEXT NOT NULL, download_url TEXT NOT NULL, next_row INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', downloaded_at TEXT);
CREATE TABLE experiments (id TEXT PRIMARY KEY, video_id TEXT, hypothesis TEXT NOT NULL, outcome_metric TEXT NOT NULL, cohort TEXT NOT NULL, window_start TEXT NOT NULL, window_end TEXT NOT NULL, notes TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE cursors (id TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE leases (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
INSERT INTO leases VALUES('sync',0);

CREATE TABLE bulk_pages (report_id TEXT NOT NULL, page INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(report_id,page), FOREIGN KEY(report_id) REFERENCES bulk_reports(id) ON DELETE CASCADE);
