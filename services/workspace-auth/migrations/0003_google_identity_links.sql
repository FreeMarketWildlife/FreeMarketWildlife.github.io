CREATE TABLE google_identity_links (
  google_sub TEXT PRIMARY KEY,
  user_sub TEXT NOT NULL REFERENCES users(google_sub)
);
