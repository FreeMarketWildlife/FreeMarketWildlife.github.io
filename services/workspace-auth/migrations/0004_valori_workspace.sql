-- Extend the workspace catalog without granting access or changing existing memberships.
CREATE TABLE memberships_next (
  email TEXT NOT NULL,
  workspace TEXT NOT NULL CHECK(workspace IN ('philip-aram','troy-kearns','kat-kai','valori-corson')),
  google_sub TEXT,
  PRIMARY KEY(email, workspace)
);
INSERT INTO memberships_next (email, workspace, google_sub)
  SELECT email, workspace, google_sub FROM memberships;
DROP TABLE memberships;
ALTER TABLE memberships_next RENAME TO memberships;
