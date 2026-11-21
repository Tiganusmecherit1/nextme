-- Automatic steps / heart rate from phones and watches (Apple Health via Shortcuts, Health Connect via webhook apps)
ALTER TABLE users ADD COLUMN sync_token_hash TEXT;
ALTER TABLE users ADD COLUMN last_sync_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_sync ON users(sync_token_hash);
ALTER TABLE daily_logs ADD COLUMN steps_source TEXT;
ALTER TABLE daily_logs ADD COLUMN resting_hr INTEGER;
ALTER TABLE daily_logs ADD COLUMN hr_avg INTEGER;
ALTER TABLE daily_logs ADD COLUMN hr_max INTEGER;
ALTER TABLE daily_logs ADD COLUMN hr_sum INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_logs ADD COLUMN hr_n INTEGER NOT NULL DEFAULT 0;
-- Raw step intervals from Health Connect, so re-sent records are not counted twice
CREATE TABLE IF NOT EXISTS sync_steps (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (user_id, start_time, end_time)
);
CREATE INDEX IF NOT EXISTS idx_sync_steps_day ON sync_steps(user_id, date);
