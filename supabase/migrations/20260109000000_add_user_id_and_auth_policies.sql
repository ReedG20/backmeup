-- Add user_id column to sessions table
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for efficient user lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all operations on turns" ON turns;
DROP POLICY IF EXISTS "Allow all operations on insights" ON insights;

-- Create user-specific RLS policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for turns (via session ownership)
CREATE POLICY "Users can view turns of own sessions" ON turns
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = turns.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can create turns in own sessions" ON turns
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = turns.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update turns in own sessions" ON turns
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = turns.session_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = turns.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete turns in own sessions" ON turns
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = turns.session_id
    AND sessions.user_id = auth.uid()
  ));

-- Create RLS policies for insights (via session ownership)
CREATE POLICY "Users can view insights of own sessions" ON insights
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = insights.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can create insights in own sessions" ON insights
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = insights.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update insights in own sessions" ON insights
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = insights.session_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = insights.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete insights in own sessions" ON insights
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = insights.session_id
    AND sessions.user_id = auth.uid()
  ));
