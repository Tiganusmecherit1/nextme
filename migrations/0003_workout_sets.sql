-- Logged sets from the guided workout (kg × reps, or seconds for timed holds)
CREATE TABLE IF NOT EXISTS workout_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  session_key TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_no INTEGER NOT NULL,
  kg REAL,
  reps INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sets_user_ex ON workout_sets(user_id, exercise_id, date);
CREATE INDEX IF NOT EXISTS idx_sets_user_date ON workout_sets(user_id, date);
