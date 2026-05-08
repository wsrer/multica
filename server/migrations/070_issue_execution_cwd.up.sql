-- Per-issue execution working directory override (absolute path).
-- When set, daemon task execution uses this path as cwd instead of
-- creating/reusing the default isolated workdir.
ALTER TABLE issue
ADD COLUMN execution_cwd TEXT;
