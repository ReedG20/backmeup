-- Create insights table for AI-generated fact-checks and argument support
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  trigger_turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notification_body TEXT NOT NULL,
  expanded_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient session lookups
CREATE INDEX idx_insights_session_id ON insights(session_id);

-- Create index for ordering insights by trigger turn
CREATE INDEX idx_insights_trigger_turn_id ON insights(trigger_turn_id);

-- Create index for timeline ordering within a session
CREATE INDEX idx_insights_session_created ON insights(session_id, created_at);

-- Enable Row Level Security
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- For now, create permissive policies (allow all operations)
-- These should be tightened when authentication is implemented
CREATE POLICY "Allow all operations on insights" ON insights
  FOR ALL
  USING (true)
  WITH CHECK (true);

