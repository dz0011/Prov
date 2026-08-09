-- Supabase table for storing a user's provenance journal

CREATE TABLE IF NOT EXISTS journals (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Optional: create an index on updated_at
CREATE INDEX IF NOT EXISTS journals_updated_at_idx ON journals (updated_at);
