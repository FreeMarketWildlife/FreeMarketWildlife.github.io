-- Extend the workspace catalog without granting access or changing existing memberships.
CREATE TABLE memberships_next (
  email TEXT NOT NULL,
  workspace TEXT NOT NULL CHECK(workspace IN ('philip-aram','troy-kearns','kat-kai','valori-corson')),
  google_sub TEXT,
  PRIMARY KEY(email, workspace)
);
-- Primary workspace is determined by rowid order. Retain the exact IDs, including gaps.
INSERT INTO memberships_next (rowid, email, workspace, google_sub)
  SELECT rowid, email, workspace, google_sub FROM memberships ORDER BY rowid;
DROP TABLE memberships;
ALTER TABLE memberships_next RENAME TO memberships;
