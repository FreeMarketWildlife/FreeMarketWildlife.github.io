CREATE TABLE users (
  google_sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE memberships (
  email TEXT NOT NULL,
  workspace TEXT NOT NULL CHECK(workspace IN ('philip-aram','troy-kearns','kat-kai')),
  google_sub TEXT,
  PRIMARY KEY(email, workspace)
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL REFERENCES users(google_sub),
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE oauth_states (
  state_hash TEXT PRIMARY KEY,
  verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE owner_identity (singleton INTEGER PRIMARY KEY CHECK(singleton=1), google_sub TEXT NOT NULL);
