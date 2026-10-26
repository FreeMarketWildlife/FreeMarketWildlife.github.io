CREATE TABLE business_inquiries (
 id TEXT PRIMARY KEY,
 user_sub TEXT NOT NULL REFERENCES users(google_sub),
 request_id TEXT NOT NULL,
 email TEXT NOT NULL,
 name TEXT NOT NULL,
 notes TEXT NOT NULL,
 skills TEXT NOT NULL,
 interests TEXT NOT NULL,
 recommendations TEXT NOT NULL,
 chosen TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 notification_status TEXT NOT NULL DEFAULT 'pending',
 notification_attempts INTEGER NOT NULL DEFAULT 0,
 notification_next_at INTEGER NOT NULL DEFAULT 0,
 UNIQUE(user_sub,request_id)
);
CREATE INDEX business_inquiries_user_created ON business_inquiries(user_sub,created_at);
CREATE INDEX business_inquiries_pending ON business_inquiries(notification_status,notification_next_at);
CREATE TABLE business_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
